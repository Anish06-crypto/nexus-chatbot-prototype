import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, FlatList, RefreshControl, Text } from "react-native";
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
