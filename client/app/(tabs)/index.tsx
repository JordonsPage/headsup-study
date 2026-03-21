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
type InputMode = "type" | "pdf" | "image";

export default function HomeScreen() {
  const [mode, setMode] = useState<InputMode>("type");
  const [text, setText] = useState("");
  const [cards, setCards] = useState<{ term: string; definition: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("Generating...");
  const [setName, setSetName] = useState("");
  const router = useRouter();

  // ── API helpers ────────────────────────────────────────────────────────────

  async function generateFromText() {
    if (!text.trim()) {
      Alert.alert("Empty", "Paste or type your notes first.");
      return;
    }
    setLoadingLabel("Generating cards...");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setCards(data.cards);
    } catch (e) {
      Alert.alert("Error", String(e));
    }
    setLoading(false);
  }

  async function generateFromFile(formData: FormData, label: string) {
    setLoadingLabel(label);
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

  async function pickPDF() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      const formData = new FormData();
      formData.append("file", { uri: file.uri, name: file.name, type: "application/pdf" } as any);
      await generateFromFile(formData, `Reading "${file.name}"...`);
    } catch (e) {
      Alert.alert("Error", String(e));
    }
  }

  async function pickImage() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Allow photo library access to upload images.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.85,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      const formData = new FormData();
      formData.append("file", {
        uri: asset.uri,
        name: "image.jpg",
        type: asset.mimeType || "image/jpeg",
      } as any);
      await generateFromFile(formData, "Reading image...");
    } catch (e) {
      Alert.alert("Error", String(e));
    }
  }

  async function saveSet() {
    if (!setName.trim()) { Alert.alert("Name required", "Give this set a name."); return; }
    if (!cards.length) { Alert.alert("No cards", "Generate cards first."); return; }
    try {
      const existing = await AsyncStorage.getItem("card_sets");
      const sets = existing ? JSON.parse(existing) : [];
      sets.push({ id: Date.now().toString(), name: setName.trim(), cards, createdAt: Date.now() });
      await AsyncStorage.setItem("card_sets", JSON.stringify(sets));
      Alert.alert("Saved!", `"${setName}" saved with ${cards.length} cards.`);
      setSetName("");
    } catch {
      Alert.alert("Error", "Could not save.");
    }
  }

  // ── Generate button logic ──────────────────────────────────────────────────

  function handleGenerate() {
    if (mode === "type") generateFromText();
    else if (mode === "pdf") pickPDF();
    else pickImage();
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  const MODES: { key: InputMode; label: string; icon: string }[] = [
    { key: "type", label: "Type", icon: "✏️" },
    { key: "pdf", label: "PDF", icon: "📄" },
    { key: "image", label: "Image", icon: "🖼️" },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <Text style={styles.title}>Heads Up Study</Text>
      <Text style={styles.subtitle}>AI-powered flashcards from your notes</Text>

      {/* Settings shortcut */}
      <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push("/settings" as any)}>
        <Text style={styles.settingsBtnText}>⚙️ Settings</Text>
      </TouchableOpacity>

      {/* Create card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Create Flashcards</Text>

        {/* Mode selector */}
        <View style={styles.modeRow}>
          {MODES.map(({ key, label, icon }) => (
            <TouchableOpacity
              key={key}
              style={[styles.modeBtn, mode === key && styles.modeBtnActive]}
              onPress={() => setMode(key)}
            >
              <Text style={styles.modeBtnIcon}>{icon}</Text>
              <Text style={[styles.modeBtnText, mode === key && styles.modeBtnTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Type input */}
        {mode === "type" && (
          <TextInput
            style={styles.input}
            placeholder={
              "Paste your notes or type terms here.\n\nExamples:\n• Mitochondria: powerhouse of the cell\n• Photosynthesis: plants converting light to energy\n\nWorks with bullet lists, paragraphs, or raw vocab."
            }
            multiline
            value={text}
            onChangeText={setText}
            textAlignVertical="top"
          />
        )}

        {/* PDF info */}
        {mode === "pdf" && (
          <View style={styles.uploadInfo}>
            <Text style={styles.uploadInfoIcon}>📄</Text>
            <Text style={styles.uploadInfoTitle}>Upload a PDF</Text>
            <Text style={styles.uploadInfoDesc}>
              Select any PDF — lecture slides, textbook pages, study guides — and Claude will extract the key terms and definitions.
            </Text>
          </View>
        )}

        {/* Image info */}
        {mode === "image" && (
          <View style={styles.uploadInfo}>
            <Text style={styles.uploadInfoIcon}>🖼️</Text>
            <Text style={styles.uploadInfoTitle}>Upload a Photo</Text>
            <Text style={styles.uploadInfoDesc}>
              Take a photo of your handwritten or printed notes. Claude will read and extract flashcards automatically.
            </Text>
          </View>
        )}

        {/* Generate button */}
        <TouchableOpacity
          style={[styles.generateBtn, loading && styles.btnDisabled]}
          onPress={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={[styles.generateBtnText, { marginLeft: 10 }]}>{loadingLabel}</Text>
            </View>
          ) : (
            <Text style={styles.generateBtnText}>
              {mode === "type" ? "✨ Generate Flashcards" : mode === "pdf" ? "📄 Choose PDF" : "🖼️ Choose Image"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Generated cards */}
      {cards.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {cards.length} Cards Generated
          </Text>

          {/* Save row */}
          <View style={styles.saveRow}>
            <TextInput
              style={styles.nameInput}
              placeholder="Name this set to save it..."
              value={setName}
              onChangeText={setSetName}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={saveSet}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>

          {/* Play buttons */}
          <TouchableOpacity
            style={[styles.playBtn, { backgroundColor: "#2ecc71" }]}
            onPress={() =>
              router.push({ pathname: "/game" as any, params: { cards: JSON.stringify(cards) } })
            }
          >
            <Text style={styles.playBtnText}>🎮 Start Timed Game</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.playBtn, { backgroundColor: "#3498db", marginBottom: 16 }]}
            onPress={() =>
              router.push({ pathname: "/review" as any, params: { cards: JSON.stringify(cards) } })
            }
          >
            <Text style={styles.playBtnText}>📖 Review Mode</Text>
          </TouchableOpacity>

          {/* Card preview */}
          {cards.map((c, i) => (
            <View key={i} style={styles.previewCard}>
              <Text style={styles.previewTerm}>{c.term}</Text>
              <Text style={styles.previewDef}>{c.definition}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Onboarding */}
      {!cards.length && !loading && (
        <View style={[styles.card, { backgroundColor: "#eef6ff" }]}>
          <Text style={styles.sectionTitle}>How it works</Text>
          {[
            ["✏️", "Add your notes", "Type, paste, upload a PDF, or photo your notes"],
            ["✨", "AI generates cards", "Claude extracts key terms and definitions for you"],
            ["🎮", "Study your way", "Timed game with tilt controls, or relaxed review mode"],
          ].map(([icon, title, desc]) => (
            <View key={title} style={styles.step}>
              <Text style={styles.stepIcon}>{icon}</Text>
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

  title: { fontSize: 30, fontWeight: "bold", textAlign: "center", color: "#6C63FF" },
  subtitle: { fontSize: 13, color: "#999", textAlign: "center", marginTop: 4, marginBottom: 16 },

  settingsBtn: { alignSelf: "flex-end", paddingVertical: 6, paddingHorizontal: 12, backgroundColor: "#fff", borderRadius: 20, borderWidth: 1, borderColor: "#e0e0ff", marginBottom: 16 },
  settingsBtnText: { fontSize: 13, color: "#555" },

  card: { backgroundColor: "#fff", borderRadius: 16, padding: 18, marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 14 },

  // Mode selector
  modeRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  modeBtn: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: "#e0e0e0", backgroundColor: "#fafafa" },
  modeBtnActive: { borderColor: "#6C63FF", backgroundColor: "#f0eeff" },
  modeBtnIcon: { fontSize: 20, marginBottom: 2 },
  modeBtnText: { fontSize: 12, fontWeight: "600", color: "#888" },
  modeBtnTextActive: { color: "#6C63FF" },

  // Text input
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 14, fontSize: 14, minHeight: 160, marginBottom: 14, lineHeight: 22, color: "#333" },

  // Upload info panels
  uploadInfo: { alignItems: "center", paddingVertical: 24, paddingHorizontal: 16, marginBottom: 14 },
  uploadInfoIcon: { fontSize: 48, marginBottom: 10 },
  uploadInfoTitle: { fontSize: 17, fontWeight: "bold", color: "#333", marginBottom: 6 },
  uploadInfoDesc: { fontSize: 14, color: "#777", textAlign: "center", lineHeight: 20 },

  // Generate button
  generateBtn: { backgroundColor: "#6C63FF", padding: 16, borderRadius: 12, alignItems: "center" },
  btnDisabled: { opacity: 0.6 },
  generateBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  loadingRow: { flexDirection: "row", alignItems: "center" },

  // Save row
  saveRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  nameInput: { flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 10, fontSize: 14 },
  saveBtn: { backgroundColor: "#6C63FF", paddingHorizontal: 16, borderRadius: 10, justifyContent: "center" },
  saveBtnText: { color: "#fff", fontWeight: "bold" },

  // Play buttons
  playBtn: { padding: 15, borderRadius: 12, alignItems: "center", marginBottom: 10 },
  playBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  // Card preview
  previewCard: { backgroundColor: "#f8f7ff", padding: 12, borderRadius: 10, marginBottom: 8 },
  previewTerm: { fontSize: 15, fontWeight: "bold", color: "#6C63FF" },
  previewDef: { fontSize: 13, color: "#555", marginTop: 3 },

  // Onboarding steps
  step: { flexDirection: "row", gap: 12, marginBottom: 14, alignItems: "flex-start" },
  stepIcon: { fontSize: 22, width: 32, textAlign: "center" },
  stepTitle: { fontSize: 14, fontWeight: "700", color: "#333", marginBottom: 2 },
  stepDesc: { fontSize: 13, color: "#888", lineHeight: 18 },
});
