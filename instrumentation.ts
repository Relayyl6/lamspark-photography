export async function register() {
  // Keep-alive & background Baileys wake-up apply to persistent containers (Render), not serverless Vercel workers
  if (process.env.NEXT_RUNTIME === "nodejs" && !process.env.VERCEL) {
    console.log("[Instrumentation] Server booting on persistent host. Initializing keep-alive & channels...");
    const targetUrl =
      process.env.RENDER_EXTERNAL_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://lamspark-photography.onrender.com";

    // Auto-resume registered Baileys WhatsApp session from Neon Postgres immediately on boot
    setTimeout(async () => {
      try {
        const { getWhatsAppStatusAsync } = await import("@/lib/integrations/whatsapp/baileys");
        const status = await getWhatsAppStatusAsync();
        console.log(`[Instrumentation Channels] Baileys boot status: ${status.state}`);
      } catch (e: any) {
        console.warn("[Instrumentation Channels] Baileys boot resume error:", e.message);
      }
    }, 3000);

    // Immediate initial self-ping after server boot
    setTimeout(async () => {
      try {
        const res = await fetch(`${targetUrl}/api/keepalive`);
        console.log(`[Instrumentation Keep-Alive] Initial boot ping status: ${res.status}`);
      } catch (e: any) {
        console.warn("[Instrumentation Keep-Alive] Initial ping error:", e.message);
      }
    }, 15000);

    // Keepalive loop every 13 minutes while container is running
    setInterval(async () => {
      try {
        const res = await fetch(`${targetUrl}/api/keepalive`);
        console.log(`[Instrumentation Keep-Alive] Scheduled ping status: ${res.status} at ${new Date().toISOString()}`);
      } catch (e: any) {
        console.warn("[Instrumentation Keep-Alive] Ping error:", e.message);
      }
    }, 13 * 60 * 1000);
  }
}
