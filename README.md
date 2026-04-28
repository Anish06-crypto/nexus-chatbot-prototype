# Nexus Prototype

A React Native tenant services platform built as a demonstration 
prototype.

## What it demonstrates

- NLP-driven repair request classification using Housing Association's actual 
  urgency categories (Critical / Emergency / Urgent / Routine)
- Multi-lingual support — responds in the user's language.
- Repair submission to MongoDB via Node.js/Express API
- Real-time status dashboard with pull-to-refresh

**Multilingual NLP pipeline**  
User messages are translated to English via DeepL, classified by a 
Groq LLM (llama-3.3-70b-versatile), and the response is translated 
back to the user's language. Confirmed working in:

| Language | Test Input |
|----------|-----------|
| Urdu | میرا بوائلر کام نہیں کر رہا |
| Hindi | मेरी छत से पानی टपक रہا है |
| Welsh | Does dim gwres na dŵr poeth gyda fi |
| Polish | Mój kocioł nie działa |
| Romanian | Toaleta mea este blocată |

| Category | Trigger | Response Time |
|----------|---------|---------------|
| CRITICAL | Major water leak affecting multiple properties | 2 hours |
| EMERGENCY | No water, no power, roof leak, blocked toilet | 4 hours |
| URGENT | Blocked sink, electrical fault, smoke alarm | 5 working days |
| ROUTINE | Guttering, plasterwork, kitchen units, fencing | 14 working days |

**Automated repair logging**  
Repair form pre-populated from chatbot intent (issue type, location, 
urgency). Photo upload via Expo ImagePicker. Submitted to MongoDB via 
REST API. Reference number generated on submission (NEX-YYYY-NNNN).

**Real-time status dashboard**  
Polls the API every 10 seconds. Pull-to-refresh. Urgency and status 
badges colour-coded by category. Designed to replace "you will be 
contacted by one of our contractors."

**Test suite and CI**  
42 tests across backend and frontend, running on GitHub Actions CI on 
every push to main.

## Architecture

```
React Native (Expo SDK 52)
        ↓ POST /api/chat  |  POST /api/repairs  |  GET /api/repairs
Node.js + Express (deployed on Render)
        ↓ DeepL API          ↓ Groq API          ↓ Mongoose
        Translation          LLM Intent           MongoDB Atlas
        Layer                Classification       (repairs collection)
```

## Three Screens

**Chat** — Tenant types in any language. Chatbot responds in kind, 
classifies intent, extracts repair details. "Log this repair →" 
button appears for repair intents.

**Report** — Pre-populated repair form. Photo upload. Submits to 
MongoDB. Returns reference number.

**Status** — All submitted repairs with urgency and status badges. 
Pull-to-refresh.

## Stack

**Frontend**
- React Native + Expo SDK 52
- Expo Router (file-based navigation)
- TypeScript
- NativeWind (Tailwind CSS v3)
- Zustand (cross-screen state)
- Expo ImagePicker

**Backend**
- Node.js + Express
- MongoDB Atlas + Mongoose
- Groq SDK (llama-3.3-70b-versatile, temperature 0.3)
- DeepL API (deepl-node)
- express-rate-limit

**Testing & CI**
- Jest + Supertest + mongodb-memory-server (backend)
- jest-expo + React Native Testing Library (frontend)
- GitHub Actions (parallel backend and frontend jobs)

## Live demo

Scan with Expo Go: ![alt text](image-1.png)

> Note: The Render backend spins down after 15 minutes of inactivity 
> on the free tier. The first request after idle may take 30–60 
> seconds. Subsequent requests are instant.

## Running Locally

**Backend**
```bash
cd backend
npm install
# Add MONGODB_URI, GROQ_API_KEY, DEEPL_API_KEY to backend/.env
npm run dev
```

**Frontend**
```bash
npm install
# Add EXPO_PUBLIC_API_URL to .env
npx expo start
```

**Tests**
```bash
# Backend
cd backend && npm test

# Frontend
npm test
```
