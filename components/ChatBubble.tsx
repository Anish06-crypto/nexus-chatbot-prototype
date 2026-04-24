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
