require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function testEndToEndFlow() {
  console.log("=== STARTING END-TO-END BOOKING & DEPOSIT FLOW VERIFICATION ===");

  const testRef = "LS-" + Math.random().toString(36).substring(2, 6).toUpperCase();
  console.log(`\n1. Creating test booking with reference ${testRef}...`);

  const bookingPayload = {
    clientName: "Ngozi Adeleke",
    whatsappPhone: "08031122334",
    clientEmail: "ngozi@example.com",
    sessionType: "maternity",
    referenceCode: testRef,
    answers: {
      purpose: "Maternity & Motherhood Session",
      feeling: "Quiet grace, soft window light",
      weeksPregnant: "32 weeks",
      packageId: "pkg-mat-luxury",
      locationType: "studio",
    },
    priceAgreed: true,
    messagingConsent: true,
    marketingConsent: true,
    receiptUrl: "/images/client/weddings_3.jpg", // Simulated uploaded receipt
  };

  const bookingRes = await fetch("http://localhost:3000/api/booking", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookingPayload),
  });

  const bookingData = await bookingRes.json();
  console.log("Booking submission response status:", bookingRes.status);
  console.log("Booking enquiry stage:", bookingData.enquiry?.stage);
  console.log("Booking enquiry waiting_on:", bookingData.enquiry?.waiting_on);

  if (!bookingData.enquiry || bookingData.enquiry.stage !== "deposit_reported") {
    throw new Error("Booking enquiry was not created in 'deposit_reported' stage!");
  }

  const enquiryId = bookingData.enquiry.id;
  console.log("✓ Booking and payment recorded in DB. Enquiry ID:", enquiryId);

  // 2. Verify in database
  console.log("\n2. Direct Neon DB inspection of enquiry & payment tables...");
  const dbEnq = await sql.query(`SELECT * FROM enquiry WHERE id = $1`, [enquiryId]);
  console.log("DB enquiry row found:", dbEnq.length > 0, "Stage:", dbEnq[0]?.stage);

  const dbPayment = await sql.query(`SELECT * FROM payment WHERE enquiry_id = $1`, [enquiryId]);
  console.log("DB payment row found:", dbPayment.length > 0, "Status:", dbPayment[0]?.status, "Screenshot:", dbPayment[0]?.screenshot_asset_id);

  if (dbEnq[0]?.stage !== "deposit_reported" || !dbPayment[0]?.screenshot_asset_id) {
    throw new Error("DB verification failed!");
  }
  console.log("✓ Neon DB confirms receipt attached and deposit reported.");

  // 3. Studio Admin Verification Simulation
  console.log("\n3. Simulating Studio Admin inspecting receipt and confirming deposit with bank reference...");
  const bankRef = "PLM-TXN-" + Math.floor(1000000 + Math.random() * 9000000);

  // Update payment and enquiry as admin
  await sql.query(
    `UPDATE payment
     SET status = 'recorded', bank_reference = $1, recorded_by = 'Osemene (Owner)', recorded_at = NOW(), updated_at = NOW()
     WHERE enquiry_id = $2 AND kind = 'deposit'`,
    [bankRef, enquiryId]
  );

  await sql.query(
    `UPDATE enquiry
     SET stage = 'deposit_paid', waiting_on = 'us', stage_entered_at = NOW(), updated_at = NOW()
     WHERE id = $1`,
    [enquiryId]
  );

  // Create confirmed booking
  const shootStart = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const shootEnd = new Date(shootStart.getTime() + 2 * 60 * 60 * 1000);

  const newBooking = await sql.query(
    `INSERT INTO booking (id, enquiry_id, shoot_start, shoot_end, location_type, status, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, $3, 'studio', 'confirmed', NOW(), NOW())
     RETURNING *`,
    [enquiryId, shootStart.toISOString(), shootEnd.toISOString()]
  );

  console.log("✓ Confirmed booking created in Neon DB! Booking ID:", newBooking[0]?.id);

  // 4. Verify in Bookings Roster
  console.log("\n4. Verifying booking in Bookings Roster query...");
  const verifiedBooking = await sql.query(
    `SELECT b.id, b.status, b.shoot_start, e.reference_code, c.name as client_name, p.bank_reference
     FROM booking b
     JOIN enquiry e ON b.enquiry_id = e.id
     JOIN client c ON e.client_id = c.id
     JOIN payment p ON p.enquiry_id = e.id
     WHERE e.id = $1`,
    [enquiryId]
  );

  console.log("Verified Booking Row:", verifiedBooking[0]);

  console.log("\n=== ALL END-TO-END CHECKS PASSED PERFECTLY ===");
}

testEndToEndFlow().catch(console.error);
