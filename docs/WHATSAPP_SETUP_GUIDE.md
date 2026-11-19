# LamSparks Studio — WhatsApp Web (Baileys) & Instagram Direct Setup Guide

**Official Studio Line:** `+234 813 084 7299`  
**Official Receiving Bank:** `Fidelity Bank` · `5601662438` · `Lamsparks Photography`  
**Studio Human Inbox:** `/studio/inbox`  
**Studio Channels Settings:** `/studio/settings`  
**Integration Engine:** `@whiskeysockets/baileys` (WhatsApp Multi-Device) & `instagram-private-api`

---

## 1. Architecture Overview (Zero-API Stress)

```
┌────────────────────────────────────────────────────────┐
│                   INBOUND FLOW                         │
└────────────────────────────────────────────────────────┘
Client WhatsApp (+234...)  ─► WhatsApp Web WebSocket (Baileys) ─► Neon DB (client, conversation, message)
                                                                           │
Instagram Direct Client    ─► Instagram Session Poller         ────────────┤
                                                                           ▼
                                                              Studio Human Inbox (/studio/inbox)
                                                                - Real-time message thread
                                                                - Client profile & history
                                                                - AI-suggested draft replies

┌────────────────────────────────────────────────────────┐
│                  OUTBOUND FLOW                         │
└────────────────────────────────────────────────────────┘
Studio Operator clicks [Send] in /studio/inbox
   │
   ├── WhatsApp Channel ──► Baileys `sock.sendMessage(jid, text)` ──► Client WhatsApp Phone
   └── Instagram Channel ─► `client.entity.directThread().broadcastText()` ──► Client Instagram Direct
```

Unlike Meta's WhatsApp Cloud API (which requires Meta developer verification, Facebook Business Manager approvals, Webhook callback domains, credit cards, and per-conversation template fees), **Baileys runs directly on WhatsApp Web's Multi-Device protocol**. It is 100% free, requires zero Meta developer accounts, and works with standard WhatsApp or WhatsApp Business on your studio phone.

---

## 2. Step-by-Step WhatsApp Web (Baileys) Setup

You can link your studio phone (`+234 813 084 7299`) using either **QR Code** or **8-Digit Pairing Code**.

### Method A: Instant QR Code Scan (Recommended)
1. Open your browser and navigate to the Studio Inbox at `http://localhost:3000/studio/inbox` (or `/studio/settings`).
2. In the top channels banner, click **"Link WhatsApp Web"** (or **"Pair Device"**).
3. The server connects to WhatsApp Web servers and displays a live **QR Code** on screen.
4. On your studio phone (`+234 813 084 7299`):
   - Open **WhatsApp** (or WhatsApp Business).
   - Tap **Settings** (iOS) or the **⋮ three dots menu** (Android).
   - Tap **Linked Devices** &rarr; **Link a Device**.
   - Point your phone camera at the QR Code on screen.
5. Within 2 to 3 seconds, the status pill will turn **Emerald Green: Connected** (`WhatsApp Web Linked (+234 813 084 7299)`).

---

### Method B: 8-Digit Pairing Code (No Camera Needed)
If you are managing the studio dashboard on a separate laptop or cannot scan a screen:
1. In the Link WhatsApp modal, enter your studio phone number: `+234 813 084 7299`.
2. Click **"Request 8-Digit Pairing Code"**.
3. An 8-character alphanumeric code will appear on screen (e.g. `WASMC31V`).
4. On your studio phone:
   - Open **WhatsApp** &rarr; **Linked Devices** &rarr; **Link a Device**.
   - Tap **"Link with phone number instead"** at the bottom.
   - Type in the 8-character code shown on the screen.
5. The device will authenticate and transition to **Connected**.

---

## 3. Step-by-Step Instagram Direct Setup

1. Open `/studio/inbox` or `/studio/settings`.
2. Beside the Instagram status pill, click **"Configure Instagram"** (or **"Direct Login"**).
3. Enter your studio's Instagram credentials:
   - **Instagram Username**: (e.g. `lamsparksphotography` or `lamsparks`)
   - **Password**: Your Instagram account password
4. Click **"Log In & Authorize Direct"**.
5. The system performs a secure mobile simulation login via `instagram-private-api` and serializes the authenticated session cookies to `./data/ig_session.json`.
6. Once authenticated, client DMs sent to your Instagram profile will synchronize automatically into the same studio inbox.

---

## 4. Session Longevity: Can Baileys Sustain Long Runs?

### How Session Persistence Works
When you link your phone, WhatsApp generates cryptographic signing keys and session tokens. Baileys saves these keys to disk using `useMultiFileAuthState` at:
```
data/baileys_auth/
├── creds.json                     # Main cryptographic device credentials
├── app-state-sync-key-...json     # Encryption sync keys
└── pre-key-...json                # Pre-shared Noise session keys
```

### Key Longevity Guarantees:
1. **Survives Server Restarts**:
   If the Node.js server restarts (deployments, machine reboots, crash restarts), Baileys reads the credentials from `data/baileys_auth/` on startup. **You do NOT need to rescan the QR code or re-enter pairing codes after restarts.**
2. **Automatic Reconnection on Network Blips**:
   If the internet connection drops or WhatsApp servers restart, Baileys captures `connection.update` with `connection === 'close'`. If the status is not `loggedOut` (401), our handler automatically reconnects after 5 seconds:
   ```ts
   // lib/integrations/whatsapp/baileys.ts
   } else if (state.creds.registered) {
     stateRef.status.state = "connecting";
     setTimeout(() => initWhatsApp(), 5000);
   }
   ```
3. **WhatsApp's 14-Day Active Phone Policy**:
   WhatsApp Multi-Device maintains linked device sessions indefinitely **as long as the primary phone connects to the internet at least once every 14 days**. Since `+234 813 084 7299` is an active daily studio phone, the session will remain active indefinitely.
4. **Unlinking / Intentional Logout**:
   The session only invalidates if:
   - You tap **"Log Out"** on the phone under WhatsApp > Linked Devices.
   - You click **"Unlink WhatsApp"** in `/studio/inbox` or `/studio/settings`.

---

## 5. Production Deployment Recommendations

Because Baileys maintains a live persistent WebSocket connection and writes session files to disk, **the deployment environment must provide persistent storage**:

### Recommended Production Setup:
* **Host Type:** VPS (DigitalOcean Droplet, Hetzner, AWS EC2, or Railway with persistent volume).
* **Process Manager:** `pm2` ensures that the Node application runs continuously and restarts automatically on crash:
  ```bash
  # Install PM2 globally
  npm install -g pm2

  # Build production Next.js bundle
  npm run build

  # Start with PM2
  pm2 start npm --name "lamsparks-platform" -- start

  # Save PM2 startup list
  pm2 save
  pm2 startup
  ```
* **Persistent Directory:**
  Ensure the `./data` folder is preserved across deployments so credentials are not wiped on new code releases.
* **If Using Docker:**
  Mount a persistent volume for the data directory:
  ```dockerfile
  VOLUME ["/app/data"]
  ```

---

## 6. Official Receiving Bank Details

Whenever clients agree to pricing or report transfers, payments must be routed to the official studio corporate account:

* **Bank Institution:** `Fidelity Bank`
* **Account Number:** `5601662438`
* **Account Beneficiary:** `Lamsparks Photography`
* **Verification Rule:** Team members cross-check bank alerts/statements before clicking **"Verify & Confirm Deposit"** in `/studio/deposits`.

---

## 7. Testing End-to-End Inbound & Outbound

1. **Inbound Test:**
   - From any client phone, send a WhatsApp message to `+234 813 084 7299` (e.g. *"Hello LamSparks, I'd like to book a Maternity session"*).
   - In `/studio/inbox`, the message will appear within 1–2 seconds with an AI label (`session_inquiry`) and a suggested response.
2. **Outbound Test:**
   - In `/studio/inbox`, select the conversation.
   - Click the AI suggested draft or type your custom message.
   - Click **Send**.
   - The message is delivered immediately via Baileys to the client's WhatsApp chat.
3. **Receipt Verification Test:**
   - Client sends receipt screenshot or uploads on `/book`.
   - Admin verifies in `/studio/deposits` against Fidelity Bank account `5601662438`.
   - Date is locked on the Studio Calendar (`/studio/calendar`).
