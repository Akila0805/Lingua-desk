# 🌐 LinguaDesk — Multilingual Ticket Clearance Console

**LinguaDesk** is a real-time, multilingual customer support ticketing system that removes the language barrier between customers and support engineers — with built-in SLA tracking, priority-based routing, automatic escalation, and full audit trails.

🔗 **Live demo:** [your-deployment-url.vercel.app](https://lingua-desk-2jfp.vercel.app) <!-- update with your actual URL -->

---

## 📌 The problem

Support teams often serve customers across many languages, but engineers answering tickets are usually only fluent in one — typically English. That creates a real bottleneck: companies either hire multilingual staff (expensive, hard to scale) or customers get stuck waiting for someone who can read their language.

**LinguaDesk removes that barrier entirely:**
1. A customer writes their issue in their **own language**.
2. It's **automatically translated to English** the moment it arrives.
3. The engineer reads and replies **only in English** — no language skills required.
4. The reply is **automatically translated back** into the customer's language before delivery.

On top of that, every ticket is governed by priority-based SLA deadlines, automatic escalation when a deadline is at risk, and a complete audit trail for accountability.

---

## ✨ Features

- 🌍 **19-language support** with automatic bidirectional translation (Hindi, Tamil, Telugu, Arabic, Chinese, Spanish, French, and more)
- ⏱️ **Priority-based SLA engine** — Critical (30m), High (45m), Medium (4h), Low (12h) — with live countdown timers that shift green → amber → red
- 🚨 **Automatic escalation** — tickets with less than 15% of their SLA window remaining are auto-flagged and jump to the top of the queue, regardless of priority tier
- 🙋 **Ticket claiming** — engineers can claim a ticket to signal ownership; replying to an unclaimed ticket auto-assigns it
- 📜 **Full audit trail** — every state change (submitted, translated, claimed, resolved, escalated) is logged with a timestamp and visible per ticket
- 📊 **Reports dashboard** — SLA compliance rate, average resolution time (overall and per priority), and ticket volume by language
- 🔁 **Resilient translation** — failed translation attempts retry automatically with backoff; the person never sees a "failed" state, just a brief "Translating…"
- 🛡️ **Rate limiting** — protects the ticket-submission endpoint from abuse

---

## 🏗️ Tech stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite |
| **AI / Translation** | Claude API (Anthropic) — server-side only, key never exposed to the browser |
| **Backend** | Node.js Serverless Functions (deployed on Vercel) |
| **Database** | Upstash Redis (via Vercel Marketplace) — shared, persistent ticket storage |
| **Hosting** | Vercel |

### Architecture at a glance

```
┌─────────────────┐        ┌──────────────────────┐        ┌─────────────────┐
│  React Frontend  │──────▶│ /api/translate         │──────▶│  Claude API      │
│  (Vite)          │       │ (serverless function)  │       │  (Anthropic)     │
└─────────────────┘        └──────────────────────┘        └─────────────────┘
        │
        ▼
┌──────────────────────┐        ┌─────────────────┐
│ /api/tickets           │──────▶│  Upstash Redis   │
│ (serverless function)  │       │  (shared storage)│
└──────────────────────┘        └─────────────────┘
```

The API key lives only in a Vercel environment variable and is read exclusively by the serverless function — the browser never has direct access to it or to Anthropic's API.

---

## 📁 Project structure

```
linguadesk/
├── api/
│   ├── translate.js      # Proxies translation requests to Claude (key stays server-side)
│   └── tickets.js        # Ticket read/write, backed by Upstash Redis
├── src/
│   ├── main.jsx           # React entry point
│   └── LinguaDeskLive.jsx # Main application component (UI + client logic)
├── index.html
├── package.json
├── vite.config.js
├── vercel.json            # Explicit build/output config for Vercel
└── .env.example
```

---

## 🚀 Getting started

### 1. Clone and install
```bash
git clone https://github.com/Akila0805/Lingua-desk.git
cd Lingua-desk
npm install
```

### 2. Set up environment variables
Copy `.env.example` to `.env` and fill in:

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ Yes | Your API key from [console.anthropic.com](https://console.anthropic.com) — new accounts get free trial credit |
| `ANTHROPIC_MODEL` | Optional | Defaults to `claude-sonnet-5` |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Recommended | Auto-injected once you connect an Upstash Redis database — without it, tickets are only kept in memory and can reset on server restart |

### 3. Deploy to Vercel
1. Push this repo to GitHub (if not already)
2. Import it at [vercel.com/new](https://vercel.com/new) — Vercel auto-detects the Vite framework
3. Add `ANTHROPIC_API_KEY` under **Settings → Environment Variables**
4. Connect a Redis database: **Storage tab → Marketplace → Upstash**
5. Deploy

### 4. Local development
```bash
npm run dev          # frontend only (Vite dev server)
```
To test the `/api/*` routes locally too, use the [Vercel CLI](https://vercel.com/docs/cli):
```bash
npm i -g vercel
vercel dev
```

---

## 🖥️ How to use it

- **Customer view** — pick your language and priority, describe your issue, hit submit. You'll get an instant confirmation with your ticket ID and expected response time.
- **Engineer view** — see the live priority queue (escalated tickets first, then by priority, then by SLA urgency), open a ticket to read its English translation, claim it, and reply — your reply is translated back automatically.
- **Reports tab** — SLA compliance and resolution-time breakdowns at a glance.

---

## ⚠️ Known limitations

- Ticket data is stored as a single JSON blob under one Redis key — simple and fast, but if two people update tickets at the exact same instant, the last write wins. Fine for a demo or small team; a production system would move to per-ticket keys or a relational database.
- No customer authentication yet — tickets are looked up by email only, not a verified login.
- No email/SMS notifications — updates only appear when the app is open (polls every few seconds).

