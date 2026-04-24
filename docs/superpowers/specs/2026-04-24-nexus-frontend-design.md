# Nexus Frontend Design
**Date:** 2026-04-24  
**Project:** Nexus — Tenant Services Platform for Nehemiah Housing Association (NUCHA)  
**Stack:** React Native (Expo), expo-router, NativeWind, Zustand, Groq SDK, REST API

---

## Overview

A three-screen React Native prototype serving NUCHA's 4,000+ tenants across the West Midlands. Tenants chat with an AI assistant to describe repair issues, submit a pre-filled repair form, and track repair status. The backend (Node.js/Express + MongoDB Atlas) is already deployed.

---

## Architecture & File Structure

```
nexus-prototype/
├── app/
│   ├── _layout.tsx              # Root layout (SafeAreaProvider)
│   └── (tabs)/
│       ├── _layout.tsx          # Tab navigator (3 tabs)
│       ├── index.tsx            # Screen 1: Chatbot
│       ├── repair.tsx           # Screen 2: Repair form
│       └── status.tsx           # Screen 3: Status dashboard
├── components/
│   ├── ChatBubble.tsx
│   ├── UrgencyBadge.tsx
│   └── StatusCard.tsx           # includes StatusBadge inline
├── lib/
│   ├── groq.ts                  # Groq SDK wrapper
│   ├── api.ts                   # REST client (POST/GET /api/repairs)
│   └── intentParser.ts          # Extracts JSON block from LLM response
├── store/
│   └── repairStore.ts           # Zustand: lastIntent + setLastIntent
└── constants/
    └── colors.ts                # Hex values + URGENCY_COLORS/STATUS_COLORS maps
```

**Entry point:** expo-router takes over from `App.tsx`. Root component is `app/_layout.tsx`.

---

## Styling Approach

- **NativeWind (Tailwind)** for all layout, spacing, typography, and static colors via `className`
- **Inline `style`** only for dynamic badge colors (urgency/status) computed at runtime from lookup maps in `constants/colors.ts`
- `tailwind.config.js` defines NUCHA color tokens:

| Token      | Hex       | Usage                        |
|------------|-----------|------------------------------|
| `primary`  | `#1a2f4a` | Navy — user bubbles, header  |
| `accent`   | `#e8a020` | Amber — active tab, CTA      |
| `background`| `#faf8f5`| Warm cream — screen bg       |
| `surface`  | `#ffffff` | White — cards, assistant bubbles |
| `text`     | `#1a1a1a` | Primary text                 |
| `secondary`| `#6b7280` | Muted text, inactive tab     |

**Urgency badge colors (inline style):**

| Value       | Hex       |
|-------------|-----------|
| `CRITICAL`  | `#dc2626` |
| `EMERGENCY` | `#ea580c` |
| `URGENT`    | `#e8a020` |
| `ROUTINE`   | `#16a34a` |

**Status badge colors (inline style):**

| Value        | Hex       |
|--------------|-----------|
| `Submitted`  | `#2563eb` |
| `Assigned`   | `#7c3aed` |
| `In Progress`| `#d97706` |
| `Completed`  | `#16a34a` |

---

## Screen 1: Chatbot (`app/(tabs)/index.tsx`)

- `FlatList` of `ChatBubble` components (not ScrollView)
- User bubbles: right-aligned, `bg-primary`, white text
- Assistant bubbles: left-aligned, `bg-surface`, dark text, border
- `TextInput` + Send button inside `KeyboardAvoidingView`
- On send: calls `lib/groq.ts → sendMessage(history)` with full conversation history
- Loading indicator shown while awaiting Groq response
- Response passed to `lib/intentParser.ts → parseIntent(raw)` to extract text + intent
- When last assistant message has `intent === "REPAIR_REQUEST"`: shows "Log this repair →" CTA below chat
- Tapping CTA: saves intent to Zustand store → `router.push("/(tabs)/repair")`

**Error handling:** Groq failures append fallback message: *"Sorry, I'm having trouble connecting. Please try again."*

---

## Screen 2: Repair Form (`app/(tabs)/repair.tsx`)

- On mount: reads `lastIntent` from Zustand store
- Pre-filled fields:
  - **Issue Type:** editable `TextInput` (from `intent.issue_type`)
  - **Location:** editable `TextInput` (from `intent.location`)
  - **Urgency:** `UrgencyBadge` — display only, not editable
  - **Description:** multiline `TextInput` (from `intent.description`)
  - **Photo:** button → `expo-image-picker` → stores URI locally
- Submit: `POST /api/repairs` with `{ issue_type, location, urgency, description, photo_uri }`
- On 201: alert with reference number (e.g. `NEX-2026-4821`), clears form
- On error: alert with retry option

---

## Screen 3: Status Dashboard (`app/(tabs)/status.tsx`)

- On mount: `GET /api/repairs` → populate list
- Polling every 10 seconds via `setInterval` (cleared on unmount)
- `FlatList` of `StatusCard` components
- `RefreshControl` on FlatList for pull-to-refresh (triggers immediate refetch + resets interval)
- Empty state: *"No repairs submitted yet"* centered message
- Each `StatusCard` shows: reference, issue_type, `UrgencyBadge`, `StatusBadge`

---

## Data Flow

```
User message → groq.ts → intentParser.ts → chat state
                                          └─ if REPAIR_REQUEST → "Log this repair →" button
                                                                  └─ Zustand store → repair.tsx
                                                                                     └─ api.ts → POST /api/repairs
                                                                                                 └─ alert(reference)

status.tsx → api.ts → GET /api/repairs (on mount + every 10s + pull-to-refresh)
```

---

## Groq System Prompt

```
You are a helpful assistant for Nexus, the tenant services platform 
for Nehemiah Housing Association, which provides homes for over 4,000 
people across the West Midlands, UK.

Help tenants with: repair and maintenance requests, rent and payment 
queries, property maintenance status, general housing queries.

CRITICAL RULE: Always respond in the same language the user writes in. 
If the user writes in Urdu, respond in Urdu. If Welsh, respond in Welsh. 
Never switch to English unless the user writes in English first.

Classify the intent as one of: REPAIR_REQUEST, RENT_QUERY, 
MAINTENANCE_STATUS, GENERAL.

For repair requests, map urgency to Nehemiah's actual repair categories:
- CRITICAL: Major water leak affecting multiple properties (2hr response)
- EMERGENCY: No water, no power, roof leak, blocked toilet (4hr response)
- URGENT: Blocked sink, electrical fault, smoke alarm fault (5 working days)
- ROUTINE: Guttering, plasterwork, kitchen units, fencing (14 working days)

Keep your text response to 2-3 sentences.

At the end of EVERY response, include this JSON block:
{
  "intent": "REPAIR_REQUEST",
  "issue_type": "Boiler",
  "location": "Kitchen",
  "urgency": "URGENT",
  "description": "Boiler not producing hot water"
}
For non-repair intents, set issue_type, location, urgency, and description to null.
The JSON block must always use English keys and values regardless of the conversation language.
```

---

## Tab Bar

- 3 tabs: Chat (bubble icon), Report (wrench icon), Status (list icon)
- Active tint: `#e8a020` (accent)
- Inactive tint: `#6b7280` (secondary)
- Background: `#ffffff`

---

## Components

### `ChatBubble`
Props: `{ role: "user" | "assistant", text: string }`  
User: right-aligned, navy bg, white text. Assistant: left-aligned, white bg, dark text, border.

### `UrgencyBadge`
Props: `{ urgency: "CRITICAL" | "EMERGENCY" | "URGENT" | "ROUTINE" }`  
Pill shape. Background from `URGENCY_COLORS` map (inline style). White text. Read-only.

### `StatusCard`
Props: full `Repair` object  
Shows reference, issue_type, `UrgencyBadge`, inline `StatusBadge`. Background from `STATUS_COLORS` map.

---

## Build Order

1. `constants/colors.ts`
2. `lib/groq.ts`
3. `lib/api.ts`
4. `lib/intentParser.ts`
5. `store/repairStore.ts`
6. `components/ChatBubble.tsx`
7. `components/UrgencyBadge.tsx`
8. `components/StatusCard.tsx`
9. `app/_layout.tsx`
10. `app/(tabs)/_layout.tsx`
11. `app/(tabs)/index.tsx`
12. `app/(tabs)/repair.tsx`
13. `app/(tabs)/status.tsx`

Plus config files: `tailwind.config.js`, `babel.config.js`
