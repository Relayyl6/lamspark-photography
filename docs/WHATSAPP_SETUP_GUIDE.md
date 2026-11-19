# LamSparks Studio — WhatsApp Cloud API Setup Guide
**Owner Line:** `+234 906 498 2841`  
**Studio Endpoint:** `/api/webhooks/whatsapp`  
**Studio Inbox:** `/studio/inbox`

---

## Architecture Overview
```
Client (WhatsApp Phone) 
        ▲ 
        │ (Meta WhatsApp Cloud API)
        ▼
POST /api/webhooks/whatsapp ──► Neon PostgreSQL (message & conversation tables)
                                             │
                                             ▼
                                /studio/inbox (Human Triage & Studio Owner View)
                                             │ (Owner types reply & sends)
                                             ▼
POST /api/admin/inbox ───────► Meta Graph API (outbound message to client)
```

---

## Step-by-Step Meta WhatsApp Setup

### Step 1: Create a Meta for Developers Account & App
1. Go to [Meta for Developers](https://developers.facebook.com) and log in with the Facebook account linked to the business.
2. Click **My Apps** &rarr; **Create App**.
3. Select **Other** as the use case &rarr; Click **Next**.
4. Select **Business** as the app type &rarr; Click **Next**.
5. Set App Name to: `LamSparks Studio OS` and select your Meta Business Account.

### Step 2: Set Up WhatsApp Product
1. On the App Dashboard, find **WhatsApp** and click **Set up**.
2. Under the left sidebar, navigate to **WhatsApp** &rarr; **API Setup**.
3. You will see a temporary access token and a test phone number.

### Step 3: Register Official Studio Phone Number (`+234 906 498 2841`)
1. In **API Setup**, scroll down to **Step 5: Add a phone number**.
2. Click **Add phone number**.
3. Fill in the profile details:
   - **Business Name:** `LamSparks Photography Abuja`
   - **Category:** `Photography & Videography / Arts & Entertainment`
   - **Description:** `Unhurried luxury maternity, milestone toddler, and editorial wedding photography in Maitama, Abuja.`
4. Enter Phone Number: `+234 906 498 2841`.
5. Choose verification method: **SMS** or **Voice Call** &rarr; Enter 6-digit code.
6. Once verified, copy your **Phone number ID**.

### Step 4: Configure Webhook
1. In the left sidebar, go to **WhatsApp** &rarr; **Configuration**.
2. Beside **Webhook**, click **Edit**.
3. Set **Callback URL**: `https://<YOUR-LIVE-DOMAIN>/api/webhooks/whatsapp` (e.g. `https://lamsparks.com/api/webhooks/whatsapp`).
4. Set **Verify Token**: Any secure secret (e.g., `lamsparks_secure_token_2026`).
5. Click **Verify and Save**.
6. Under **Webhook fields**, click **Manage** &rarr; Check **messages** &rarr; Click **Subscribe**.

### Step 5: Generate Permanent System User Access Token
*Temporary tokens expire after 24 hours. A permanent token never expires:*
1. Go to [Meta Business Settings](https://business.facebook.com/settings).
2. Under **Users**, click **System Users** &rarr; Click **Add**.
3. System User Name: `LamSparks System API`, Role: `Admin`.
4. Click **Add Assets** &rarr; Assign your **LamSparks Studio OS** app with full control.
5. Click **Generate New Token**:
   - Select your App: `LamSparks Studio OS`
   - Token expiration: `Never`
   - Select permissions:
     - `whatsapp_business_messaging`
     - `whatsapp_business_management`
6. Click **Generate Token** and copy the access token.

### Step 6: Add Variables to Production Environment (`.env.local` or Hosting)
```env
WHATSAPP_PHONE_NUMBER_ID="YOUR_PHONE_NUMBER_ID"
WHATSAPP_ACCESS_TOKEN="YOUR_PERMANENT_SYSTEM_USER_TOKEN"
WHATSAPP_VERIFY_TOKEN="lamsparks_secure_token_2026"
```

---

## Verifying End-to-End Operation
1. **Inbound Test:** Send a WhatsApp message from any personal phone to `+234 906 498 2841`.
2. Open `/studio/inbox` in the Studio: The new conversation appears instantly in the sidebar with the client's name and message.
3. **Outbound Test:** Click on the conversation in `/studio/inbox`, type a response (e.g., *"Hello! We would love to capture your baby's milestone in our Maitama studio."*), and click **Send**.
4. The message will arrive directly in the client's WhatsApp chat!
