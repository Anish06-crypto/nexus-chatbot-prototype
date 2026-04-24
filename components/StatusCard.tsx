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
      <Text className="text-secondary text-xs mb-3">
        {new Date(repair.created_at).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </Text>
      <View className="flex-row gap-2">
        <UrgencyBadge urgency={repair.urgency} />
        <StatusBadge status={repair.status} />
      </View>
    </View>
  );
}
