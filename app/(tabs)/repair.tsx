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
      Alert.alert("Missing fields", "Please fill in Issue Type and Location.");
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
      <Text className="text-ink text-2xl font-bold mb-6">Report a Repair</Text>

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
