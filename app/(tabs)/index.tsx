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
import { sendMessage } from "../../lib/groq";
import { parseIntent } from "../../lib/intentParser";
import { useRepairStore } from "../../store/repairStore";

export default function ChatScreen() {
  const messages = useRepairStore((s) => s.messages);
  const addMessage = useRepairStore((s) => s.addMessage);
  const setLastIntent = useRepairStore((s) => s.setLastIntent);
  const lastIntent = useRepairStore((s) => s.lastIntent);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user" as const, content: input.trim() };
    addMessage(userMessage);
    setInput("");
    setLoading(true);

    try {
      const raw = await sendMessage([...messages, userMessage]);
      const parsed = parseIntent(raw);
      addMessage({ role: "assistant", content: parsed.text });
      setLastIntent(parsed);
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
