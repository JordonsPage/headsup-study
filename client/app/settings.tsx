import React, { useState, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const SETTINGS_KEY = "headsup_settings";

const DEFAULT_SETTINGS = {
  timerDuration: 60,
  numberOfCards: 0,
};

const TIMER_OPTIONS = [15, 30, 45, 60, 90, 120, 180, 300];
const CARD_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 50];

export default function SettingsScreen() {
  const [timerDuration, setTimerDuration] = useState(60);
  const [numberOfCards, setNumberOfCards] = useState(0);
  const router = useRouter();

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      if (data) {
        const settings = JSON.parse(data);
        setTimerDuration(settings.timerDuration ?? 60);
        setNumberOfCards(settings.numberOfCards ?? 0);
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  }

  async function handleSave() {
    try {
      await AsyncStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({ timerDuration, numberOfCards })
      );
      Alert.alert("Saved!", "Your settings have been saved.");
    } catch (e) {
      Alert.alert("Error", "Could not save settings.");
    }
  }

  function formatTimer(seconds: number) {
    if (seconds < 60) return `${seconds}s`;
    return `${seconds / 60}m`;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Timer Duration */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>⏱ Timer Duration</Text>
        <Text style={styles.sectionSubtitle}>
          How long you have to get through all cards
        </Text>
        <Text style={styles.currentValue}>{formatTimer(timerDuration)}</Text>
        <View style={styles.optionsGrid}>
          {TIMER_OPTIONS.map((val) => (
            <TouchableOpacity
              key={val}
              style={[styles.optionBtn, timerDuration === val && styles.optionBtnSelected]}
              onPress={() => setTimerDuration(val)}
            >
              <Text style={[styles.optionText, timerDuration === val && styles.optionTextSelected]}>
                {formatTimer(val)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Number of Cards */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🃏 Number of Cards</Text>
        <Text style={styles.sectionSubtitle}>
          Limit how many cards per game (0 = use all)
        </Text>
        <Text style={styles.currentValue}>
          {numberOfCards === 0 ? "All" : numberOfCards}
        </Text>
        <View style={styles.optionsGrid}>
          {CARD_OPTIONS.map((val) => (
            <TouchableOpacity
              key={val}
              style={[styles.optionBtn, numberOfCards === val && styles.optionBtnSelected]}
              onPress={() => setNumberOfCards(val)}
            >
              <Text style={[styles.optionText, numberOfCards === val && styles.optionTextSelected]}>
                {val === 0 ? "All" : val}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Info */}
      <View style={[styles.card, { backgroundColor: "#eef6ff" }]}>
        <Text style={styles.sectionTitle}>ℹ️ About Game Mode</Text>
        <Text style={styles.infoText}>• <Text style={{ fontWeight: "600" }}>Timer Duration:</Text> Total time to get through all cards</Text>
        <Text style={styles.infoText}>• <Text style={{ fontWeight: "600" }}>Card Limit:</Text> Useful for quick practice sessions</Text>
        <Text style={styles.infoText}>• <Text style={{ fontWeight: "600" }}>Review Mode:</Text> No timer — go at your own pace</Text>
      </View>

      {/* Save */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>💾 Save Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, backgroundColor: "#f8f7ff", flexGrow: 1 },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  backBtn: { fontSize: 16, color: "#6C63FF", fontWeight: "600", width: 60 },
  title: { fontSize: 22, fontWeight: "bold", color: "#333" },

  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 17, fontWeight: "bold", color: "#333", marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: "#888", marginBottom: 12 },
  currentValue: { fontSize: 36, fontWeight: "bold", color: "#6C63FF", textAlign: "center", marginBottom: 16 },

  optionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  optionBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1.5, borderColor: "#ddd", backgroundColor: "#fafafa" },
  optionBtnSelected: { borderColor: "#6C63FF", backgroundColor: "#6C63FF" },
  optionText: { fontSize: 15, fontWeight: "600", color: "#555" },
  optionTextSelected: { color: "#fff" },

  infoText: { fontSize: 13, color: "#555", marginBottom: 6 },

  saveBtn: { backgroundColor: "#6C63FF", padding: 16, borderRadius: 12, alignItems: "center", marginBottom: 40 },
  saveBtnText: { color: "#fff", fontSize: 17, fontWeight: "bold" },
});
