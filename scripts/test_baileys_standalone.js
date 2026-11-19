const baileys = require('@whiskeysockets/baileys');
const makeWASocket = baileys.default || baileys.makeWASocket;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = baileys;
const path = require('path');
const pino = require('pino');

async function test() {
  const authDir = path.resolve(__dirname, '../data/test_auth');
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'debug' }),
    printQRInTerminal: true,
    auth: state,
    browser: ['LamSparks Studio OS', 'Chrome', '1.0.0']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    console.log('Connection update:', update);
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log('Got raw QR string of length:', qr.length);
    }
    if (connection === 'close') {
      console.log('Closed with error:', lastDisconnect?.error);
      process.exit(0);
    }
  });
}

test().catch(console.error);
