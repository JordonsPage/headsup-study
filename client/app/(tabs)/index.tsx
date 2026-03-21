import React, { useState } from "react";
import { useRouter } from "expo-router";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

const API_URL = "http://137.99.168.249:8000";

export default function HomeScreen() {
  const [text, setText] = useState("");
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [setName, setSetName] = useState("");
  const router = useRouter();

  async function handleUpload(formData: FormData) {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/upload`, { method: "POST", body: formData });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setCards(data.cards);
    } catch (e) {
      Alert.alert("Upload Error", String(e));
    }
    setLoading(false);
  }

  async function handlePDFUpload() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf", copyToCacheDirectory: true });
      if (result.canceled) return;
      const file = result.assets[0];
      const formData = new FormData();
      formData.append("file", { uri: file.uri, name: file.name, type: "application/pdf" } as any);
      await handleUpload(formData);
    } catch (e) {
      Alert.alert("Error", String(e));
    }
  }

  async function handleImageUpload() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") { Alert.alert("Permission needed", "Allow photo library access to upload images."); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
      if (result.canceled) return;
      const asset = result.assets[0];
      const formData = new FormData();
      formData.append("file", { uri: asset.uri, name: "image.jpg", type: asset.mimeType || "image/jpeg" } as any);
      await handleUpload(formData);
    } catch (e) {
      Alert.alert("Error", String(e));
    }
  }

  async function handleManual() {
    if (!text.trim()) {
      Alert.alert("Empty!", "Type some vocab terms first.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setCards(data.cards);
    } catch (e) {
      Alert.alert("Error", String(e));
    }
    setLoading(false);
  }

  async function handleSaveSet() {
    if (!setName.trim()) {
      Alert.alert("Name required", "Enter a name for this card set.");
      return;
    }
    if (cards.length === 0) {
      Alert.alert("No cards", "Generate some cards first.");
      return;
    }
    try {
      const existing = await AsyncStorage.getItem("card_sets");
      const sets = existing ? JSON.parse(existing) : [];
      const newSet = {
        id: Date.now().toString(),
        name: setName.trim(),
        cards,
        createdAt: Date.now(),
      };
      sets.push(newSet);
      await AsyncStorage.setItem("card_sets", JSON.stringify(sets));
      Alert.alert("Saved!", `"${setName}" saved with ${cards.length} cards.`);
      setSetName("");
    } catch (e) {
      Alert.alert("Error", "Could not save card set.");
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <Text style={styles.title}>Heads Up Study</Text>
      <Text style={styles.subtitle}>Turn your notes into flashcards</Text>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickBtn}
          onPress={() => router.push("/my-sets" as any)}
        >
          <Text style={styles.quickBtnIcon}></Text>
          <Text style={styles.quickBtnText}>My Sets</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickBtn}
          onPress={() => router.push("/settings" as any)}
        >
          <Text style={styles.quickBtnIcon}></Text>
          <Text style={styles.quickBtnText}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Input */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Create Flashcards</Text>
        <Text style={styles.sectionSubtitle}>
          Type or paste your vocab terms and our AI will generate cards
        </Text>
        <TextInput
          style={styles.input}
          placeholder={"Example:\nPhotosynthesis: process plants use to make food\nMitochondria: powerhouse of the cell"}
          multiline
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleManual}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Generate Flashcards</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or upload a file</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.uploadRow}>
          <TouchableOpacity style={[styles.uploadBtn, loading && styles.buttonDisabled]} onPress={handlePDFUpload} disabled={loading}>
            <Text style={styles.uploadBtnText}>📄 PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.uploadBtn, loading && styles.buttonDisabled]} onPress={handleImageUpload} disabled={loading}>
            <Text style={styles.uploadBtnText}>🖼️ Image</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Generated Cards */}
      {cards.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Generated Cards ({cards.length})</Text>

          {/* Save set */}
          <View style={styles.saveRow}>
            <TextInput
              style={styles.nameInput}
              placeholder="Name this set..."
              value={setName}
              onChangeText={setSetName}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSet}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>

          {/* Action buttons */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#2ecc71", marginBottom: 10 }]}
            onPress={() => router.push({ pathname: "/game" as any, params: { cards: JSON.stringify(cards) } })}
          >
            <Text style={styles.buttonText}>🎮 Start Timed Game</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#3498db", marginBottom: 20 }]}
            onPress={() => router.push({ pathname: "/review" as any, params: { cards: JSON.stringify(cards) } })}
          >
            <Text style={styles.buttonText}>📖 Review Mode</Text>
          </TouchableOpacity>

          {/* Cards preview */}
          {cards.map((card: any, i: number) => (
            <View key={i} style={styles.flashCard}>
              <Text style={styles.term}>{card.term}</Text>
              <Text style={styles.definition}>{card.definition}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Getting started */}
      {cards.length === 0 && !loading && (
        <View style={[styles.card, { backgroundColor: "#eef6ff" }]}>
          <Text style={styles.sectionTitle}>Getting Started</Text>
          {[
            ["1", "Create or load a set", "Type terms above or load a saved set"],
            ["2", "Choose your mode", "Timed game or relaxed review"],
            ["3", "Study & improve", "Track missed terms and master your material"],
          ].map(([num, title, desc]) => (
            <View key={num} style={styles.step}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{num}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{title}</Text>
                <Text style={styles.stepDesc}>{desc}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, backgroundColor: "#f8f7ff", flexGrow: 1 },
  title: { fontSize: 32, fontWeight: "bold", textAlign: "center", color: "#6C63FF" },
  subtitle: { fontSize: 14, color: "#888", textAlign: "center", marginBottom: 24, marginTop: 4 },

  quickActions: { flexDirection: "row", gap: 12, marginBottom: 20 },
  quickBtn: { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "#e0e0ff" },
  quickBtnIcon: { fontSize: 24, marginBottom: 4 },
  quickBtnText: { fontSize: 13, fontWeight: "600", color: "#444" },

  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: "#888", marginBottom: 12 },

  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, fontSize: 15, minHeight: 140, marginBottom: 12, textAlignVertical: "top" },
  button: { backgroundColor: "#6C63FF", padding: 15, borderRadius: 10, alignItems: "center" },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  saveRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  nameInput: { flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 10, fontSize: 14 },
  saveBtn: { backgroundColor: "#6C63FF", paddingHorizontal: 16, borderRadius: 10, justifyContent: "center" },
  saveBtnText: { color: "#fff", fontWeight: "bold" },

  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#e0e0e0" },
  dividerText: { marginHorizontal: 10, fontSize: 12, color: "#aaa" },
  uploadRow: { flexDirection: "row", gap: 10 },
  uploadBtn: { flex: 1, borderWidth: 1.5, borderColor: "#6C63FF", borderRadius: 10, padding: 12, alignItems: "center" },
  uploadBtnText: { color: "#6C63FF", fontWeight: "600", fontSize: 15 },

  flashCard: { backgroundColor: "#f0eeff", padding: 14, borderRadius: 10, marginBottom: 10 },
  term: { fontSize: 16, fontWeight: "bold", color: "#6C63FF" },
  definition: { fontSize: 13, color: "#555", marginTop: 4 },

  step: { flexDirection: "row", gap: 12, marginBottom: 14, alignItems: "flex-start" },
  stepNum: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#6C63FF", alignItems: "center", justifyContent: "center" },
  stepNumText: { color: "#fff", fontWeight: "bold" },
  stepTitle: { fontSize: 14, fontWeight: "600", color: "#333" },
  stepDesc: { fontSize: 12, color: "#888", marginTop: 2 },
});
