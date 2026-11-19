const http = require('http');

let sessionCookie = '';

function request(path, options = {}, payload = null) {
  return new Promise((resolve, reject) => {
    const data = payload ? JSON.stringify(payload) : null;
    const headers = {
      ...(options.headers || {}),
      ...(sessionCookie ? { 'Cookie': sessionCookie } : {}),
      ...(data ? {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      } : {})
    };

    const req = http.request(`http://localhost:3000${path}`, {
      method: options.method || (payload ? 'POST' : 'GET'),
      headers
    }, (res) => {
      if (res.headers['set-cookie']) {
        sessionCookie = res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
      }
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function run() {
  await request('/api/auth/login', {}, {
    email: 'osemene@lamsparks.com',
    password: 'lamsparks-studio-secure-2026!'
  });

  console.log('Requesting Baileys QR code...');
  await request('/api/admin/channels/whatsapp', {}, { action: 'start' });

  for (let i = 0; i < 6; i++) {
    await new Promise(r => setTimeout(r, 1500));
    const res = await request('/api/admin/channels/whatsapp');
    console.log(`Poll ${i + 1}: status = ${res.body?.status?.state}, hasQR = ${!!res.body?.status?.qrCodeDataUrl}`);
    if (res.body?.status?.qrCodeDataUrl) {
      console.log('SUCCESS! QR Code data URL generated successfully.');
      console.log('Prefix:', res.body.status.qrCodeDataUrl.slice(0, 45));
      break;
    }
  }
}

run().catch(console.error);
