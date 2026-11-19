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
      // Capture set-cookie
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
  const loginRes = await request('/api/auth/login', {}, {
    email: 'osemene@lamsparks.com',
    password: 'lamsparks-studio-secure-2026!'
  });
  console.log('Login result:', loginRes.status, loginRes.body?.user?.name || loginRes.body);

  console.log('\n2. Simulating Inbound WhatsApp Message from Dr. Fatima Umar (+234 802 999 8811)...');
  const waRes = await request('/api/admin/inbox', {}, {
    action: 'simulate_inbound',
    channel: 'whatsapp',
    sender_name: 'Dr. Fatima Umar',
    sender_phone: '+234 802 999 8811',
    message: 'Good day LamSparks, do you have slot for executive portraiture this Saturday in Maitama studio?',
    intent_tag: 'Booking Enquiry'
  });
  console.log('WA Simulation Result:', waRes.status, waRes.body?.success, 'Conversation ID:', waRes.body?.conversation?.id);

  console.log('\n3. Simulating Inbound Instagram DM from Zainab Galadima (@zainab_g)...');
  const igRes = await request('/api/admin/inbox', {}, {
    action: 'simulate_inbound',
    channel: 'instagram',
    sender_name: 'Zainab Galadima',
    sender_phone: '@zainab_g',
    message: 'Hi! Saw your luxury motherhood photos. How much is the Luxury Motherhood package and can my husband join the session?',
    intent_tag: 'Maternity Pricing'
  });
  console.log('IG Simulation Result:', igRes.status, igRes.body?.success, 'Conversation ID:', igRes.body?.conversation?.id);

  console.log('\n4. Fetching updated Inbox conversations list...');
  const listRes = await request('/api/admin/inbox');
  console.log('Total inbox conversations:', listRes.body?.conversations?.length);
  listRes.body?.conversations?.forEach(c => {
    const last = c.messages?.[c.messages.length - 1];
    console.log(` - [${c.channel}] ${c.clientName} (${c.whatsapp}): state=${c.state}, lastMsg: "${last?.body?.slice(0, 50)}..." [AI Tag: ${last?.ai_label || 'none'}]`);
  });
}

run().catch(console.error);
