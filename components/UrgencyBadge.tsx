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
