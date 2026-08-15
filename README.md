# Outbound Voice AI Collections Agent - "Maya" (Kapture Finance)
> **Engineering Assignment Submission**  
> **Client:** Kapture Finance | **Role:** AI Voice Engineer  
> **Project Root Location:** `D:\kapture-voice-ai-agent\`

---

## 1. Executive Summary & Objective

This repository contains the complete engineer-ready implementation and design package for **Maya**, an automated outbound Voice AI Collections Agent designed for **Kapture Finance**.

Maya automates early-stage loan recovery calls (e.g., customer **Rahul Sharma**, ₹8,499 balance overdue by 12 days) while maintaining strict adherence to **RBI Fair Practices Code**, state-enforced identity verification before debt disclosure, and low-latency (< 1.2s round-trip) conversational performance.

---

## 2. Project Directory Structure (`D:\kapture-voice-ai-agent\`)

```text
D:\kapture-voice-ai-agent\
├── HLD_DOCUMENT.md               # Complete 8-Section Engineering High-Level Design Document
├── README.md                     # Comprehensive setup, Vapi setup guide, and Loom demo script
├── package.json                  # Node.js Express server dependencies
├── .env.example                  # Environment variables template
├── server.js                     # Main Express Webhook server entry point
├── routes/
│   └── webhook.js                # Router handling Vapi tool execution webhooks
├── services/
│   └── mockDatabase.js           # In-memory customer datastore & disposition logging
├── vapi_config/
│   ├── system_prompt.txt         # State-enforced system prompt for Vapi Assistant
│   ├── tool_definitions.json     # OpenAPI / Vapi JSON tool schemas
│   └── vapi_assistant_config.json # Complete Vapi Assistant configuration export
└── tests/
    ├── test_cases.json           # Comprehensive test scenario definitions
    └── test_runner.js            # Automated test runner script for webhook endpoints
```

---

## 3. Technology Stack & Service Providers

| Component | Technology / Service Provider | Role / Specification |
| :--- | :--- | :--- |
| **Voice Platform** | [Vapi.ai](https://vapi.ai/) | Telephony orchestration, WebRTC/SIP management & turn-taking |
| **Speech-to-Text (STT)**| Deepgram Nova-2 (`en-US` / Multi) | Low-latency audio transcription (~200ms endpointing) |
| **LLM Engine** | OpenAI `gpt-4o` (Temp: `0.1`) | Deterministic compliance adherence & state transitions |
| **Text-to-Speech (TTS)**| ElevenLabs / Cartesia ("Sarah") | Natural, empathetic conversational tone (~250ms latency) |
| **Webhook Backend** | Node.js (v18+) & Express | Serves tool functions (`verify_customer`, `log_ptp`, etc.) |
| **Tunneling Tool** | ngrok | Exposes local server `http://localhost:3000` to Vapi public HTTPS |

---

## 4. Step-by-Step Setup & Execution Guide

### Step 1: Install Dependencies & Launch Backend
1. Open PowerShell or Command Prompt.
2. Navigate to project root on **D drive**:
   ```bash
   cd D:\kapture-voice-ai-agent
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm start
   ```
   *The server will start on `http://localhost:3000`.*

---

### Step 2: Expose Server via ngrok
In a separate terminal window, start ngrok to create an HTTPS tunnel:
```bash
ngrok http 3000
```
Copy the generated HTTPS Forwarding URL (e.g., `https://a1b2-34-56-78-90.ngrok-free.app`). Your public webhook URL will be:
`https://a1b2-34-56-78-90.ngrok-free.app/webhook`

---

### Step 3: Configure Assistant on Vapi Dashboard
1. Log in to [Vapi.ai Dashboard](https://dashboard.vapi.ai/).
2. Navigate to **Assistants** $\rightarrow$ Click **Create Assistant** $\rightarrow$ Select **Blank Template**.
3. **Model & Transcriber Settings:**
   * **Transcriber:** Deepgram, Model: `nova-2`, Language: `en-US`
   * **Model:** OpenAI, Model: `gpt-4o`, Temperature: `0.1`
   * **Voice:** ElevenLabs (e.g., `Rachel` / `Sarah`)
4. **First Message:**
   ```text
   Hello, this is Maya calling from Kapture Finance. Am I speaking with Mr. Rahul Sharma?
   ```
5. **System Prompt:**
   Copy the complete contents from `D:\kapture-voice-ai-agent\vapi_config\system_prompt.txt` into the System Prompt box.
6. **Register Tools:**
   Under the **Tools** tab in Vapi, create 5 function tools matching the schemas in `D:\kapture-voice-ai-agent\vapi_config\tool_definitions.json`:
   * `verify_customer`
   * `log_promise_to_pay`
   * `send_payment_link`
   * `escalate_to_agent`
   * `mark_disposition`
   Set the **Server URL** for all tools to your ngrok URL: `https://a1b2-34-56-78-90.ngrok-free.app/webhook`.

---

## 5. Automated Verification & Testing

Execute the automated test suite against your running backend server:
```bash
npm test
```
**Expected Output:**
```text
=======================================================
  RUNNING AUTOMATED VOICE AI TOOL WEBHOOK SUITE
  Target Server: http://localhost:3000
=======================================================

🔹 Scenario [TEST_01_HAPPY_PATH_PTP]: Happy Path - Identity Verified & Promise to Pay Collected
   ✅ PASS: verify_customer -> Status: success | Msg: "Customer verified successfully. Debt details unlocked."
   ✅ PASS: log_promise_to_pay -> Status: success | Msg: "Promise to Pay successfully logged for 2026-08-20."
   ✅ PASS: send_payment_link -> Status: success | Msg: "Payment link https://pay.kapturefinance.com/pay/lnk_88392 sent successfully via SMS and WhatsApp."
   ✅ PASS: mark_disposition -> Status: success | Msg: "Call disposition marked as PTP_COLLECTED."

...

=======================================================
  TEST RESULTS SUMMARY
  Total Tool Validations: 10
  Passed:                 10
  Failed:                 0
  Success Rate:           100.0%
=======================================================
```

---

## 6. Loom Demo Video Walkthrough Script (2–4 Minutes)

When recording your Loom or OBS demo video, follow this script to demonstrate full competency:

### **Part 1: Intro & Architecture (30 Seconds)**
* Show `HLD_DOCUMENT.md` and brief the 8-hop pipeline (< 1.2s SLA target).
* Show the running Node.js server terminal and active ngrok tunnel.

### **Part 2: Happy Path Demo - Promise to Pay (1.5 Minutes)**
1. Click **Test Call** in Vapi dashboard.
2. **Maya:** *"Hello, this is Maya calling from Kapture Finance. Am I speaking with Mr. Rahul Sharma?"*
3. **User (You):** *"Yes, speaking."*
4. **Maya:** *"Thank you, Mr. Sharma. For security verification, could you please confirm the last 4 digits of your PAN card or Aadhaar?"*
5. **User (You):** *"It is 4321."*
6. *(Watch terminal log `verify_customer` hit and return `verified: true`)*
7. **Maya:** *"Thank you for verifying. I am calling regarding your account with Kapture Finance. We have an outstanding balance of ₹8,499 due on 3rd August. Can we process this payment today?"*
8. **User (You):** *"I can pay this Friday."*
9. **Maya:** *"Great! I have logged a Promise to Pay for Friday, August 20th, and sent an instant payment link to your phone via SMS and WhatsApp. Have a great day!"*
10. *(Show terminal logs for `log_promise_to_pay`, `send_payment_link`, and `mark_disposition`)*

### **Part 3: Edge Case Demo - Debt Dispute / Already Paid (1 Minute)**
1. Initiate second call. Authenticate with code `4321`.
2. When Maya states the overdue balance, reply: *"I already paid this yesterday via GPay!"*
3. **Maya:** *"Thank you for letting me know. Bank updates can take 24 to 48 hours to reflect. I have marked your account as Already Paid and logged this for verification. You won't receive further reminder calls while we verify. Goodbye!"*
4. *(Show terminal log for `mark_disposition(ALREADY_PAID)`)*

---

## 7. Key Architectural & Compliance Highlights

1. **State-Enforced Gating:** Debt details cannot be disclosed prior to identity authentication. If an unverified or third party speaks, Maya refrains from mentioning debt.
2. **RBI Calling Hours:** Configured for 08:00 AM – 07:00 PM contact windows.
3. **Instant DNC Handling:** Any opt-out request immediately flags `DO_NOT_CALL` and terminates the call within 10 seconds.
4. **PII Masking:** Customer names and contact credentials are masked on server logs (`Rahul S****`, `****4321`).
5. **Anti-Hallucination Guardrails:** Low LLM temperature (`0.1`) and strict instructions prevent unauthorized waiver promises exceeding 10%.

---
*Developed for Kapture Finance AI Engineering Assignment*
