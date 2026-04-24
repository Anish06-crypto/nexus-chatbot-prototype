# Nexus Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a three-screen React Native (Expo) frontend — Chatbot, Repair Form, Status Dashboard — connecting to an existing Node.js/MongoDB backend via REST and Groq's LLM API.

**Architecture:** expo-router for file-based navigation with a three-tab layout. NativeWind v4 (Tailwind CSS) for styling with inline `style` for dynamic badge colors. Zustand for sharing the last parsed repair intent between the chatbot and repair form screens.

**Tech Stack:** React Native 0.81 / Expo 54, expo-router 6, NativeWind 4, Zustand 5, groq-sdk 1, expo-image-picker, TypeScript 5

---

## File Map

| File | Role |
|------|------|
| `babel.config.js` | NativeWind Babel preset |
| `metro.config.js` | NativeWind CSS processing |
| `tailwind.config.js` | NUCHA color tokens + content paths |
| `global.css` | Tailwind directives entry point |
| `constants/colors.ts` | Hex values + URGENCY_COLORS / STATUS_COLORS lookup maps |
| `lib/intentParser.ts` | Pure function: extracts JSON block from Groq raw response |
| `lib/groq.ts` | Groq SDK wrapper: `sendMessage(history)` → raw string |
| `lib/api.ts` | REST client: `createRepair`, `fetchRepairs` + `Repair` type |
| `store/repairStore.ts` | Zustand store: `lastIntent` + `setLastIntent` + `clearIntent` |
| `components/ChatBubble.tsx` | Message bubble (user = navy right, assistant = white left) |
| `components/UrgencyBadge.tsx` | Pill badge with urgency colour from `URGENCY_COLORS` |
| `components/StatusCard.tsx` | Card with reference, issue type, UrgencyBadge, StatusBadge |
| `app/_layout.tsx` | Root layout: SafeAreaProvider + imports global.css |
| `app/(tabs)/_layout.tsx` | Three-tab navigator (Chat / Report / Status) |
| `app/(tabs)/index.tsx` | Screen 1: Chatbot |
| `app/(tabs)/repair.tsx` | Screen 2: Repair form |
| `app/(tabs)/status.tsx` | Screen 3: Status dashboard |

---

## Task 1: NativeWind + expo-router Configuration

**Files:**
- Create: `babel.config.js`
- Create: `metro.config.js`
- Create: `tailwind.config.js`
- Create: `global.css`
- Modify: `app.json` (add `scheme`)

- [ ] **Step 1: Create `babel.config.js`**

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

- [ ] **Step 2: Create `metro.config.js`**

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
```

- [ ] **Step 3: Create `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#1a2f4a",
        accent: "#e8a020",
        background: "#faf8f5",
        surface: "#ffffff",
        ink: "#1a1a1a",
        secondary: "#6b7280",
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 4: Create `global.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Add `scheme` to `app.json`**

In `app.json`, add `"scheme": "nexus"` inside the `"expo"` object so expo-router can handle deep links:

```json
{
  "expo": {
    "name": "nexus-prototype",
    "slug": "nexus-prototype",
    "scheme": "nexus",
    ...
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add babel.config.js metro.config.js tailwind.config.js global.css app.json
git commit -m "feat: configure NativeWind v4 and expo-router scheme"
```

---

## Task 2: `constants/colors.ts`

**Files:**
- Create: `constants/colors.ts`

- [ ] **Step 1: Create the file**

```ts
const Colors = {
  primary: "#1a2f4a",
  accent: "#e8a020",
  background: "#faf8f5",
  surface: "#ffffff",
  ink: "#1a1a1a",
  secondary: "#6b7280",
} as const;

export const URGENCY_COLORS: Record<
  "CRITICAL" | "EMERGENCY" | "URGENT" | "ROUTINE",
  string
> = {
  CRITICAL: "#dc2626",
  EMERGENCY: "#ea580c",
  URGENT: "#e8a020",
  ROUTINE: "#16a34a",
};

export const STATUS_COLORS: Record<
  "Submitted" | "Assigned" | "In Progress" | "Completed",
  string
> = {
  Submitted: "#2563eb",
  Assigned: "#7c3aed",
  "In Progress": "#d97706",
  Completed: "#16a34a",
};

export default Colors;
```

- [ ] **Step 2: Commit**

```bash
git add constants/colors.ts
git commit -m "feat: add NUCHA colour palette and badge lookup maps"
```

---

## Task 3: `lib/intentParser.ts` (TDD)

**Files:**
- Create: `lib/intentParser.ts`
- Create: `lib/__tests__/intentParser.test.ts`
- Modify: `package.json` (add jest config + devDependencies)

- [ ] **Step 1: Install Jest dependencies**

```bash
npx expo install jest-expo --save-dev
npm install --save-dev @types/jest
```

- [ ] **Step 2: Add Jest config to `package.json`**

Add inside the top-level object in `package.json`:

```json
"jest": {
  "preset": "jest-expo"
}
```

Also add to `"scripts"`:

```json
"test": "jest"
```

- [ ] **Step 3: Create test file `lib/__tests__/intentParser.test.ts`**

```ts
import { parseIntent } from "../intentParser";

const REPAIR_RESPONSE = `I can see your boiler isn't producing hot water. This is classified as an urgent repair under Nehemiah's schedule, with a 5 working day response time. I'll help you log this repair now.

{
  "intent": "REPAIR_REQUEST",
  "issue_type": "Boiler",
  "location": "Kitchen",
  "urgency": "URGENT",
  "description": "Boiler not producing hot water"
}`;

const GENERAL_RESPONSE = `Rent payments are due on the first of each month. You can pay online via the tenant portal or by Direct Debit.

{
  "intent": "RENT_QUERY",
  "issue_type": null,
  "location": null,
  "urgency": null,
  "description": null
}`;

const MALFORMED_RESPONSE = `Here is some text without any JSON block at all.`;

describe("parseIntent", () => {
  it("extracts text and repair intent from a REPAIR_REQUEST response", () => {
    const result = parseIntent(REPAIR_RESPONSE);
    expect(result.intent).toBe("REPAIR_REQUEST");
    expect(result.issue_type).toBe("Boiler");
    expect(result.location).toBe("Kitchen");
    expect(result.urgency).toBe("URGENT");
    expect(result.description).toBe("Boiler not producing hot water");
    expect(result.text).toContain("I can see your boiler");
    expect(result.text).not.toContain('"intent"');
  });

  it("extracts text and nulls from a non-repair response", () => {
    const result = parseIntent(GENERAL_RESPONSE);
    expect(result.intent).toBe("RENT_QUERY");
    expect(result.issue_type).toBeNull();
    expect(result.urgency).toBeNull();
    expect(result.text).toContain("Rent payments");
  });

  it("falls back to GENERAL intent when JSON is missing", () => {
    const result = parseIntent(MALFORMED_RESPONSE);
    expect(result.intent).toBe("GENERAL");
    expect(result.issue_type).toBeNull();
    expect(result.text).toBe(MALFORMED_RESPONSE);
  });
});
```

- [ ] **Step 4: Run test to confirm it fails**

```bash
npx jest lib/__tests__/intentParser.test.ts --no-coverage
```

Expected: `Cannot find module '../intentParser'`

- [ ] **Step 5: Create `lib/intentParser.ts`**

```ts
export type ParsedResponse = {
  text: string;
  intent: string;
  issue_type: string | null;
  location: string | null;
  urgency: string | null;
  description: string | null;
};

export function parseIntent(raw: string): ParsedResponse {
  const jsonStart = raw.lastIndexOf("{");
  const jsonEnd = raw.lastIndexOf("}");

  let parsed: Record<string, unknown> | null = null;
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    try {
      parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
    } catch {
      parsed = null;
    }
  }

  const text =
    jsonStart !== -1 ? raw.slice(0, jsonStart).trim() : raw.trim();

  return {
    text,
    intent: (parsed?.intent as string) ?? "GENERAL",
    issue_type: (parsed?.issue_type as string | null) ?? null,
    location: (parsed?.location as string | null) ?? null,
    urgency: (parsed?.urgency as string | null) ?? null,
    description: (parsed?.description as string | null) ?? null,
  };
}
```

- [ ] **Step 6: Run tests to confirm they pass**

```bash
npx jest lib/__tests__/intentParser.test.ts --no-coverage
```

Expected: `3 passed, 3 total`

- [ ] **Step 7: Commit**

```bash
git add lib/intentParser.ts lib/__tests__/intentParser.test.ts package.json package-lock.json
git commit -m "feat: add intentParser with tests (extracts JSON from Groq response)"
```

---

## Task 4: `lib/groq.ts`

**Files:**
- Create: `lib/groq.ts`

- [ ] **Step 1: Create the file**

```ts
import Groq from "groq-sdk";

const client = new Groq({
  apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

const SYSTEM_PROMPT = `You are a helpful assistant for Nexus, the tenant services platform \
for Nehemiah Housing Association, which provides homes for over 4,000 \
people across the West Midlands, UK.

Help tenants with: repair and maintenance requests, rent and payment \
queries, property maintenance status, general housing queries.

CRITICAL RULE: Always respond in the same language the user writes in. \
If the user writes in Urdu, respond in Urdu. If Welsh, respond in Welsh. \
Never switch to English unless the user writes in English first.

Classify the intent as one of: REPAIR_REQUEST, RENT_QUERY, \
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
The JSON block must always use English keys and values regardless of the conversation language.`;

export type Message = {
  role: "user" | "assistant";
  content: string;
};

export async function sendMessage(history: Message[]): Promise<string> {
  const completion = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
    ],
  });
  return completion.choices[0].message.content ?? "";
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/groq.ts
git commit -m "feat: add Groq SDK wrapper with NUCHA system prompt"
```

---

## Task 5: `lib/api.ts`

**Files:**
- Create: `lib/api.ts`

- [ ] **Step 1: Create the file**

```ts
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export type Repair = {
  _id: string;
  reference: string;
  issue_type: string;
  location: string;
  urgency: "CRITICAL" | "EMERGENCY" | "URGENT" | "ROUTINE";
  description: string;
  photo_uri: string | null;
  status: "Submitted" | "Assigned" | "In Progress" | "Completed";
  created_at: string;
};

export type CreateRepairPayload = {
  issue_type: string;
  location: string;
  urgency: string;
  description: string;
  photo_uri?: string | null;
};

export async function createRepair(
  payload: CreateRepairPayload
): Promise<Repair> {
  const response = await fetch(`${API_URL}/api/repairs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to create repair");
  }
  return response.json() as Promise<Repair>;
}

export async function fetchRepairs(): Promise<Repair[]> {
  const response = await fetch(`${API_URL}/api/repairs`);
  if (!response.ok) throw new Error("Failed to fetch repairs");
  return response.json() as Promise<Repair[]>;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/api.ts
git commit -m "feat: add REST client for repairs API"
```

---

## Task 6: `store/repairStore.ts`

**Files:**
- Create: `store/repairStore.ts`

- [ ] **Step 1: Create the file**

```ts
import { create } from "zustand";
import { ParsedResponse } from "../lib/intentParser";

type RepairStore = {
  lastIntent: ParsedResponse | null;
  setLastIntent: (intent: ParsedResponse) => void;
  clearIntent: () => void;
};

export const useRepairStore = create<RepairStore>((set) => ({
  lastIntent: null,
  setLastIntent: (intent) => set({ lastIntent: intent }),
  clearIntent: () => set({ lastIntent: null }),
}));
```

- [ ] **Step 2: Commit**

```bash
git add store/repairStore.ts
git commit -m "feat: add Zustand store for repair intent state"
```

---

## Task 7: `components/ChatBubble.tsx`

**Files:**
- Create: `components/ChatBubble.tsx`

- [ ] **Step 1: Create the file**

```tsx
import React from "react";
import { View, Text } from "react-native";

type Props = {
  role: "user" | "assistant";
  text: string;
};

export default function ChatBubble({ role, text }: Props) {
  const isUser = role === "user";
  return (
    <View className={`mb-2 px-3 ${isUser ? "items-end" : "items-start"}`}>
      <View
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-primary rounded-tr-sm"
            : "bg-surface border border-gray-200 rounded-tl-sm"
        }`}
      >
        <Text className={isUser ? "text-white" : "text-ink"}>{text}</Text>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ChatBubble.tsx
git commit -m "feat: add ChatBubble component"
```

---

## Task 8: `components/UrgencyBadge.tsx`

**Files:**
- Create: `components/UrgencyBadge.tsx`

- [ ] **Step 1: Create the file**

```tsx
import React from "react";
import { View, Text } from "react-native";
import { URGENCY_COLORS } from "../constants/colors";

type Urgency = "CRITICAL" | "EMERGENCY" | "URGENT" | "ROUTINE";

type Props = {
  urgency: Urgency;
};

export default function UrgencyBadge({ urgency }: Props) {
  return (
    <View
      style={{ backgroundColor: URGENCY_COLORS[urgency] }}
      className="rounded-full px-3 py-1 self-start"
    >
      <Text className="text-white text-xs font-semibold">{urgency}</Text>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/UrgencyBadge.tsx
git commit -m "feat: add UrgencyBadge component"
```

---

## Task 9: `components/StatusCard.tsx`

**Files:**
- Create: `components/StatusCard.tsx`

`StatusBadge` lives in this file — it has no other consumer.

- [ ] **Step 1: Create the file**

```tsx
import React from "react";
import { View, Text } from "react-native";
import { Repair } from "../lib/api";
import UrgencyBadge from "./UrgencyBadge";
import { STATUS_COLORS } from "../constants/colors";

function StatusBadge({ status }: { status: Repair["status"] }) {
  return (
    <View
      style={{ backgroundColor: STATUS_COLORS[status] }}
      className="rounded-full px-3 py-1 self-start"
    >
      <Text className="text-white text-xs font-semibold">{status}</Text>
    </View>
  );
}

type Props = {
  repair: Repair;
};

export default function StatusCard({ repair }: Props) {
  return (
    <View className="bg-surface rounded-2xl p-4 mb-3 border border-gray-100">
      <Text className="font-mono text-primary font-bold mb-1">
        {repair.reference}
      </Text>
      <Text className="text-ink text-base font-medium mb-3">
        {repair.issue_type}
      </Text>
      <View className="flex-row gap-2">
        <UrgencyBadge urgency={repair.urgency} />
        <StatusBadge status={repair.status} />
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/StatusCard.tsx
git commit -m "feat: add StatusCard component with inline StatusBadge"
```

---

## Task 10: `app/_layout.tsx`

**Files:**
- Create: `app/_layout.tsx`

This replaces `App.tsx` + `index.ts` as the app entry point. expo-router takes over routing from here.

- [ ] **Step 1: Create the file**

```tsx
import "../global.css";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: add root layout with SafeAreaProvider and NativeWind CSS import"
```

---

## Task 11: `app/(tabs)/_layout.tsx`

**Files:**
- Create: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.secondary,
        tabBarStyle: { backgroundColor: Colors.surface },
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.surface,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="repair"
        options={{
          title: "Report",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="construct-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="status"
        options={{
          title: "Status",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(tabs)/_layout.tsx"
git commit -m "feat: add three-tab navigator with NUCHA colours"
```

---

## Task 12: `app/(tabs)/index.tsx` — Chatbot Screen

**Files:**
- Create: `app/(tabs)/index.tsx`

- [ ] **Step 1: Create the file**

```tsx
import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import ChatBubble from "../../components/ChatBubble";
import { sendMessage, Message } from "../../lib/groq";
import { parseIntent } from "../../lib/intentParser";
import { useRepairStore } from "../../store/repairStore";

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastParsed, setLastParsed] = useState<
    ReturnType<typeof parseIntent> | null
  >(null);
  const flatListRef = useRef<FlatList>(null);
  const setLastIntent = useRepairStore((s) => s.setLastIntent);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const raw = await sendMessage(newHistory);
      const parsed = parseIntent(raw);
      const assistantMessage: Message = {
        role: "assistant",
        content: parsed.text,
      };
      setMessages([...newHistory, assistantMessage]);
      setLastParsed(parsed);
    } catch {
      const errorMessage: Message = {
        role: "assistant",
        content:
          "Sorry, I'm having trouble connecting. Please try again.",
      };
      setMessages([...newHistory, errorMessage]);
      setLastParsed(null);
    } finally {
      setLoading(false);
    }
  }

  function handleLogRepair() {
    if (!lastParsed) return;
    setLastIntent(lastParsed);
    router.push("/(tabs)/repair");
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <ChatBubble role={item.role} text={item.content} />
        )}
        contentContainerStyle={{ paddingVertical: 16 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {loading && (
        <ActivityIndicator
          className="my-2"
          color="#e8a020"
        />
      )}

      {lastParsed?.intent === "REPAIR_REQUEST" && !loading && (
        <TouchableOpacity
          className="mx-4 mb-2 bg-accent rounded-xl py-3 items-center"
          onPress={handleLogRepair}
        >
          <Text className="text-white font-semibold text-base">
            Log this repair →
          </Text>
        </TouchableOpacity>
      )}

      <View className="flex-row items-center px-4 pb-4 pt-2 bg-surface border-t border-gray-100">
        <TextInput
          className="flex-1 bg-background rounded-xl px-4 py-3 text-ink mr-2"
          placeholder="Describe your repair issue..."
          placeholderTextColor="#6b7280"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          multiline
        />
        <TouchableOpacity
          className="bg-primary rounded-xl px-4 py-3"
          onPress={handleSend}
        >
          <Text className="text-white font-semibold">Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(tabs)/index.tsx"
git commit -m "feat: add chatbot screen with Groq integration and repair CTA"
```

---

## Task 13: `app/(tabs)/repair.tsx` — Repair Form Screen

**Files:**
- Create: `app/(tabs)/repair.tsx`

- [ ] **Step 1: Create the file**

```tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRepairStore } from "../../store/repairStore";
import UrgencyBadge from "../../components/UrgencyBadge";
import { createRepair } from "../../lib/api";
import type { ParsedResponse } from "../../lib/intentParser";

type Urgency = "CRITICAL" | "EMERGENCY" | "URGENT" | "ROUTINE";

export default function RepairScreen() {
  const lastIntent = useRepairStore((s) => s.lastIntent);
  const clearIntent = useRepairStore((s) => s.clearIntent);

  const [issueType, setIssueType] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (lastIntent) {
      setIssueType(lastIntent.issue_type ?? "");
      setLocation(lastIntent.location ?? "");
      setDescription(lastIntent.description ?? "");
    }
  }, [lastIntent]);

  async function handlePickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function handleSubmit() {
    if (!issueType.trim() || !location.trim()) {
      Alert.alert(
        "Missing fields",
        "Please fill in Issue Type and Location."
      );
      return;
    }
    setSubmitting(true);
    try {
      const repair = await createRepair({
        issue_type: issueType.trim(),
        location: location.trim(),
        urgency: lastIntent?.urgency ?? "ROUTINE",
        description: description.trim(),
        photo_uri: photoUri,
      });
      Alert.alert(
        "Repair Submitted",
        `Your reference number is ${repair.reference}`
      );
      setIssueType("");
      setLocation("");
      setDescription("");
      setPhotoUri(null);
      clearIntent();
    } catch {
      Alert.alert(
        "Submission Failed",
        "We couldn't submit your repair. Would you like to try again?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Retry", onPress: handleSubmit },
        ]
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 16 }}
    >
      <Text className="text-ink text-2xl font-bold mb-6">
        Report a Repair
      </Text>

      <View className="mb-4">
        <Text className="text-secondary text-sm mb-1 font-medium">
          Issue Type
        </Text>
        <TextInput
          className="bg-surface rounded-xl px-4 py-3 text-ink border border-gray-100"
          value={issueType}
          onChangeText={setIssueType}
          placeholder="e.g. Boiler, Leak, Electrics"
          placeholderTextColor="#6b7280"
        />
      </View>

      <View className="mb-4">
        <Text className="text-secondary text-sm mb-1 font-medium">
          Location
        </Text>
        <TextInput
          className="bg-surface rounded-xl px-4 py-3 text-ink border border-gray-100"
          value={location}
          onChangeText={setLocation}
          placeholder="e.g. Kitchen, Bathroom"
          placeholderTextColor="#6b7280"
        />
      </View>

      {lastIntent?.urgency && (
        <View className="mb-4">
          <Text className="text-secondary text-sm mb-2 font-medium">
            Urgency
          </Text>
          <UrgencyBadge urgency={lastIntent.urgency as Urgency} />
        </View>
      )}

      <View className="mb-4">
        <Text className="text-secondary text-sm mb-1 font-medium">
          Description
        </Text>
        <TextInput
          className="bg-surface rounded-xl px-4 py-3 text-ink border border-gray-100"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the issue in more detail..."
          placeholderTextColor="#6b7280"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={{ minHeight: 100 }}
        />
      </View>

      <View className="mb-6">
        <Text className="text-secondary text-sm mb-2 font-medium">
          Photo (optional)
        </Text>
        <TouchableOpacity
          className="bg-surface rounded-xl py-3 px-4 border border-gray-100 items-center"
          onPress={handlePickPhoto}
        >
          <Text className="text-primary font-medium">
            {photoUri ? "Change Photo" : "Add Photo"}
          </Text>
        </TouchableOpacity>
        {photoUri && (
          <Image
            source={{ uri: photoUri }}
            style={{ width: "100%", height: 192, borderRadius: 12, marginTop: 8 }}
            resizeMode="cover"
          />
        )}
      </View>

      <TouchableOpacity
        className={`rounded-xl py-4 items-center ${
          submitting ? "bg-secondary" : "bg-primary"
        }`}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text className="text-white font-bold text-base">
          {submitting ? "Submitting..." : "Submit Repair Request"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(tabs)/repair.tsx"
git commit -m "feat: add repair form screen with pre-fill from Zustand intent"
```

---

## Task 14: `app/(tabs)/status.tsx` — Status Dashboard Screen

**Files:**
- Create: `app/(tabs)/status.tsx`

- [ ] **Step 1: Create the file**

```tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  FlatList,
  RefreshControl,
  Text,
} from "react-native";
import { fetchRepairs } from "../../lib/api";
import type { Repair } from "../../lib/api";
import StatusCard from "../../components/StatusCard";

export default function StatusScreen() {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadRepairs = useCallback(async () => {
    try {
      const data = await fetchRepairs();
      setRepairs(data);
    } catch {
      // silently fail on background poll; pull-to-refresh retries
    }
  }, []);

  function startPolling() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(loadRepairs, 10_000);
  }

  useEffect(() => {
    loadRepairs();
    startPolling();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await loadRepairs();
    startPolling();
    setRefreshing(false);
  }

  return (
    <FlatList
      className="flex-1 bg-background"
      data={repairs}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => <StatusCard repair={item} />}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#e8a020"
        />
      }
      ListEmptyComponent={
        <View className="flex-1 items-center justify-center py-20">
          <Text className="text-secondary text-base">
            No repairs submitted yet
          </Text>
        </View>
      }
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(tabs)/status.tsx"
git commit -m "feat: add status dashboard with polling and pull-to-refresh"
```

---

## Final Verification

- [ ] **Run the app**

```bash
npx expo start
```

Scan the QR code in Expo Go. Verify:
1. App loads on the Chat tab
2. Typing a repair message (e.g. "my boiler is broken") and sending shows a response and "Log this repair →" button
3. Tapping the button navigates to Report tab with pre-filled fields
4. Submitting the form shows a reference number alert
5. Status tab shows the submitted repair (may take a few seconds)
6. Pull-to-refresh on Status tab updates the list

- [ ] **Run unit tests**

```bash
npx jest --no-coverage
```

Expected: `3 passed, 3 total`
