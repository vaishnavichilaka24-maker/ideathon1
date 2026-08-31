# Haven | Psychological First Aid (PFA) & Caregiver Debriefing Sanctuary 🩺🛡️

**Haven** is a mission-driven, user-authenticated Psychological First Aid (PFA) sanctuary and compassion fatigue debriefing platform built for frontline healthcare workers, humanitarian aid teams, first responders, and crisis counselors. 

Powered by **Gemini 3.6 Flash** and **Cloud Firestore**, Haven provides trauma-informed shift decompressions, automated client/patient PII scrubbing, somatic box breathing pacers, global crisis hotlines, and clinical PFA debriefing synthesis reports—all protected under owner-isolated Firestore rules and zero-hardcoded secrets.

---

## 🏗️ Architecture & Security Model

```
┌────────────────────────────────────────────────────────┐       HTTPS       ┌─────────────────────────────────────────┐
│                      Client (SPA)                      │ ────────────────> │            Cloud Run Server             │
│  - Firebase Auth (Federated Google Sign-In)            │                   │  - Express API (/api/gemini/*)          │
│  - Real-time Firestore Subcollections                  │                   │  - Secret Manager (GEMINI_API_KEY)      │
│  - Interactive Box Breathing Somatic Pacer             │                   │  - PFA Clinical System Directives       │
│  - Crisis Hotlines Directory (988, Frontline, IFRC)    │                   │  - PII / HIPAA Anonymization Engine     │
│  - Client PII Redaction Toolbar                        │                   │  - Gemini 3.6 Flash Fallback Chain      │
└───────────────────────────┬────────────────────────────┘                   └────────────────────┬────────────────────┘
                            │                                                                     │
                            │ Direct Client SDK                                                   │ GoogleGenAI SDK
                            ▼                                                                     ▼
┌────────────────────────────────────────────────────────┐                   ┌─────────────────────────────────────────┐
│                    Cloud Firestore                     │                   │              Gemini Models              │
│  - /users/{userId}/sessions/{sessionId}/interactions   │                   │  1. gemini-3.6-flash                    │
│  - Rule: request.auth.uid == userId                    │                   │  2. gemini-3.1-flash-lite               │
└────────────────────────────────────────────────────────┘                   │  3. gemini-flash-latest                 │
                                                                             │  4. gemini-3.7-flash                    │
                                                                             └─────────────────────────────────────────┘
```

### Agentic Threat Model & Countermeasures (OWASP Mapping)

| Threat Zone | Specific Threat / Vector | Implemented Countermeasure | OWASP Standard |
| :--- | :--- | :--- | :--- |
| **1. Input Surfaces** | Prompt injection, PII / patient name leaks, oversized transcripts | Top-level Express body parsing (10MB limit), `/api/gemini/anonymize` endpoint for PII redaction, null-safe payload destructuring | OWASP Top 10 A03 / LLM02 |
| **2. Planning & Reasoning** | System prompt hijacking via shift narratives | Clear demarcation of trauma-informed system instructions from user transcripts; raw reflections treated strictly as data to analyze | OWASP LLM01 |
| **3. Tool & Execution** | API key leakage, quota exhaustion, 503/429 errors | Server-side Express proxy (keys never sent to browser), 4-tier model fallback ladder (`gemini-3.6-flash` -> `3.1-flash-lite` -> `flash-latest` -> `3.7-flash`) | OWASP LLM05 / A01 |
| **4. Memory & State** | Cross-tenant data leaks, unauthorized access to traumatic debrief records | Strict subcollection isolation under `/users/{userId}/...`, deployed Firestore security rules, recursive undefined-stripping prior to DB writes | OWASP A01 Broken Access Control |
| **5. Inter-System Comm** | Token sniffing, MITM, insecure credentials | Federated Google Identity via Firebase Auth (zero plain password handling), HTTPS transport on Cloud Run | OWASP A07 / LLM06 |

---

## 🔒 Firestore Security Rules

The following security rules enforce strict tenant isolation, guaranteeing caregivers' private debrief records cannot be accessed across accounts:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🚀 Setup & Local Development

### 1. Prerequisites
- Node.js 20+
- Google Cloud SDK (`gcloud` CLI)
- Firebase CLI (`npm install -g firebase-tools`)

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
GEMINI_API_KEY="your-gemini-api-key"
```

### 3. Install Dependencies & Start Server
```bash
npm install
npm run dev
```
The unified full-stack server starts on `http://localhost:3000`.

---

## ☁️ Production Deployment to Google Cloud Run

### 1. Enable Required Cloud APIs
```bash
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com
```

### 2. Secret Management Setup
Store your Gemini API key in Google Cloud Secret Manager and grant access to the Cloud Run runtime service account:

```bash
# Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant the default compute service account access
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3. Deploy to Cloud Run
Build and deploy the application container to Cloud Run:

```bash
gcloud run deploy haven-pfa-sanctuary \
  --source . \
  --region asia-east1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest
```

### 4. Required Campaign Verification Binding
Apply the required campaign label for automated challenge verification:

```bash
gcloud run services update haven-pfa-sanctuary \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=asia-east1
```

---

## 🧪 Functional Walkthrough & Test Guide

| Step # | User Action | Expected Observable Result |
| :--- | :--- | :--- |
| **TC-01** | Arrive at root URL as unauthenticated user | Landing page displays with specialized PFA Sanctuary branding, Google Sign-In button, Box Breathing quick launcher, 24/7 Crisis Resource trigger, and "Threat Model & Security Matrix" button. |
| **TC-02** | Click "Threat Model" button in Navbar or Landing | Modal opens displaying the 5 Threat Zones table with OWASP mappings and the deployed `firestore.rules` block. |
| **TC-03** | Click "Somatic Breathing Pacer" button | Interactive 4-4-4-4 Box Breathing visual guide opens with inhale, hold, exhale, hold cues, audio chime toggle, and round counter. |
| **TC-04** | Click "24/7 Crisis Hotlines" button | Slide-out directory opens listing verified free confidential hotlines (988 Lifeline, Frontline Workers Hotline, Disaster Distress, Trevor Project, IFRC Psychological Support) with one-click dial links. |
| **TC-05** | Click "Enter PFA Sanctuary" / "Continue with Google" | Firebase Google Sign-In popup opens. Upon successful authentication, redirects to private debrief dashboard with caregiver avatar in top navigation. |
| **TC-06** | Click "New Shift Debrief" or select a protocol anchor | New debrief session is created in Firestore under `/users/{userId}/sessions/{sessionId}` with default role (Healthcare) and severity (High Stress). |
| **TC-07** | Click "Triage & Somatics" bar | Drawer opens to adjust Caregiver Role (Healthcare, Humanitarian, First Responder, Social Work), Shift Intensity, Stress Slider (1-10), and Somatic tension check-in pills (Chest Tightness, Jaw, Gut, Headache). Values update Firestore in real-time. |
| **TC-08** | Switch Protocol Mode (Incident Debrief, Compassion Fatigue, Moral Injury, Somatic Reset) | Debrief context updates with specialized clinical anchors and empathetic guidance. |
| **TC-09** | Type shift notes containing names or locations, then click "Redact Patient / PII Names" | Client calls `/api/gemini/anonymize`; Gemini scrubs identifiable names and locations into anonymous tokens (e.g. `[PATIENT-1]`, `[HOSPITAL-LOCATION]`) directly in the composer. |
| **TC-10** | Send debrief message | User entry persists to Firestore. Gemini responds with trauma-informed PFA guidance using the resilient fallback ladder (`gemini-3.6-flash`), and response is saved to Firestore. |
| **TC-11** | Click "Generate PFA Report" | Server queries `/api/gemini/summarize` with clinical debrief context. Synthesis modal opens displaying structured 4-phase Psychological First Aid report (Context, Distress Drivers, Resiliency Separation, 24-Hour Recovery Protocol). |
| **TC-12** | Click "Download Report" or "Copy Synthesis" | Markdown file (`pfa-debrief-...md`) downloads or copies to clipboard. |
| **TC-13** | Search shift archive | Sidebar search filters debrief records in real-time by title, preview, or clinical summary. |
| **TC-14** | Click trash icon on active session | Confirms and permanently purges sensitive shift records and interactions from Firestore. |
| **TC-15** | Click "Themes" in Navbar | Opens the Sanctuary Color Engine modal with 6 themes (Verdant Forest, Twilight Azure, Golden Amber, Rose Solace, Amethyst Calm, Monolith Slate). Selecting a theme instantly updates all UI accents and ambient glows. |
| **TC-16** | Click "Soundscapes" in Navbar | Opens the Neuro-Acoustic Soundscape Player synthesizing pure Web Audio waveforms (432Hz Drone, Theta 5.5Hz Binaural Wave, Ocean Surf, Rain Solace) with real-time volume and sleep timer. |
| **TC-17** | Click "Sphere of Control" in debrief editor | Deconstructs the shift narrative into Direct Control, Sphere of Influence, and Systemic Out-of-Control weights with interactive "Exhale & Release" actions. |
| **TC-18** | Click "Daily Spark" in debrief editor | Generates an instant 30-second micro-grounding anchor with a physical check-in and affirmation tailored to the caregiver's role. |
| **TC-19** | Click Sign Out | Session terminates, state resets, and UI returns safely to the Landing Page. |
