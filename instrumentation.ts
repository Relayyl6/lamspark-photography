export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("[Instrumentation] Server booting on Render. Starting keep-alive heartbeat...");
    const targetUrl =
      process.env.RENDER_EXTERNAL_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://lamspark-photography.onrender.com";

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
