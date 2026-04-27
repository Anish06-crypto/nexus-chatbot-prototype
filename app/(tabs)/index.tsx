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
import { sendChatMessage } from '../../lib/api';
import { useRepairStore } from "../../store/repairStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const EXAMPLE_PROMPTS = [
  { label: "🇵🇰 میرا بوائلر", text: "میرا بوائلر کام نہیں کر رہا" },
  { label: "🇮🇳 छत से पानी", text: "मेरी छत से पानी टपक रहा है" },
  { label: "🏴󠁧󠁢󠁷󠁬󠁳󠁿 Dim gwres", text: "Does dim gwres na dŵr poeth gyda fi" },
  { label: "🇵🇱 Kocioł", text: "Mój kocioł nie działa" },
  { label: "🇷🇴 Toaletă", text: "Toaleta mea este blocată" },
];

export default function ChatScreen() {
  const messages = useRepairStore((s) => s.messages);
  const addMessage = useRepairStore((s) => s.addMessage);
  const setLastIntent = useRepairStore((s) => s.setLastIntent);
  const lastIntent = useRepairStore((s) => s.lastIntent);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const insets = useSafeAreaInsets();

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessageContent = input.trim();
    const userMessage = { role: "user" as const, content: userMessageContent };
    addMessage(userMessage);
    setInput("");
    setLoading(true);

    try {
      const result = await sendChatMessage(userMessageContent, messages);
      addMessage({ role: 'assistant', content: result.text });
      if (result.intent) {
        setLastIntent(result.intent);
      }
    } catch {
      addMessage({
        role: "assistant",
        content: "Sorry, I'm having trouble connecting. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleLogRepair() {
    router.push("/(tabs)/repair");
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={insets.bottom + 49}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <ChatBubble role={item.role} content={item.content} />
        )}
        contentContainerStyle={{ paddingVertical: 16 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />
      {messages.length === 0 && (
        <View className="px-4 pb-2">
          <Text className="text-secondary text-xs mb-2 font-medium">
            Tap a suggestion or type your message:
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((prompt) => (
              <TouchableOpacity
                key={prompt.label}
                className="bg-surface border border-gray-200 rounded-full px-3 py-2"
                onPress={() => setInput(prompt.text)}
              >
                <Text className="text-ink text-xs">{prompt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      {loading && <ActivityIndicator className="my-2" color="#e8a020" />}

      {lastIntent?.intent === "REPAIR_REQUEST" && !loading && (
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
          className={`rounded-xl px-4 py-3 ${loading ? "bg-gray-300" : "bg-primary"}`}
          onPress={handleSend}
          disabled={loading}
        >
          <Text className="text-white font-semibold">Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
