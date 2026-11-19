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
  console.log('1. Logging in as Studio Owner...');
  await request('/api/auth/login', {}, {
    email: 'osemene@lamsparks.com',
    password: 'lamsparks-studio-secure-2026!'
  });

  console.log('\n2. Testing GET /api/admin/channels/whatsapp...');
  const waRes = await request('/api/admin/channels/whatsapp');
  console.log('WhatsApp status response:', waRes.status, waRes.body);

  console.log('\n3. Testing GET /api/admin/channels/instagram...');
  const igRes = await request('/api/admin/channels/instagram');
  console.log('Instagram status response:', igRes.status, igRes.body);
}

run().catch(console.error);
