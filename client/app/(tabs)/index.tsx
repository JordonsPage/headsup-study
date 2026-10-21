import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import {
  Button,
  DeckArt,
  Heading,
  Icon,
  Page,
  Panel,
  Pop,
  palette,
  ui,
  type IconName,
} from "@/components/play-ui";
import { type Card, SAMPLE_CARDS, SETS_KEY } from "@/lib/cards";
import { fileForm, generateCards } from "@/lib/api";
const MODES: {
  key: "type" | "pdf" | "image";
  label: string;
  icon: IconName;
}[] = [
  { key: "type", label: "Notes", icon: "pencil-outline" },
  { key: "pdf", label: "PDF", icon: "document-text-outline" },
  { key: "image", label: "Photo", icon: "camera-outline" },
];
export default function HomeScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<"type" | "pdf" | "image">("type");
  const [text, setText] = useState("");
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [setName, setSetName] = useState("");
  const [notice, setNotice] = useState("");
  async function generate() {
    if (loading) return;
    if (mode === "type" && !text.trim()) {
      setNotice("Add a few notes first, or try the starter deck below.");
      return;
    }
    setLoading(true);
    setNotice("");
    try {
      let body: string | FormData;
      if (mode === "type") body = JSON.stringify({ text: text.trim() });
      else if (mode === "pdf") {
        const result = await DocumentPicker.getDocumentAsync({
          type: "application/pdf",
          copyToCacheDirectory: true,
        });
        if (result.canceled) return;
        const file = result.assets[0];
        body = await fileForm(file.uri, file.name, "application/pdf");
      } else {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted)
          throw new Error("Allow photo access to choose your notes.");
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.85,
        });
        if (result.canceled) return;
        const file = result.assets[0];
        body = await fileForm(
          file.uri,
          file.fileName || "notes.jpg",
          file.mimeType || "image/jpeg",
        );
      }
      setCards(await generateCards(body));
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Could not reach the server. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }
  async function save() {
    if (!setName.trim()) {
      setNotice("Give your deck a name before saving.");
      return;
    }
    try {
      const data = await AsyncStorage.getItem(SETS_KEY);
      const existing = data ? JSON.parse(data) : [];
      if (!Array.isArray(existing)) throw new Error("Invalid saved decks");
      await AsyncStorage.setItem(
        SETS_KEY,
        JSON.stringify([
          ...existing,
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: setName.trim(),
            cards,
            createdAt: Date.now(),
          },
        ]),
      );
      setNotice(`Saved “${setName.trim()}” to My decks.`);
      setSetName("");
    } catch {
      Alert.alert("Could not save", "Please try again.");
    }
  }
  function open(pathname: "/game" | "/review", deck = cards) {
    router.push({ pathname, params: { cards: JSON.stringify(deck) } });
  }
  return (
    <Page>
      <View
        style={[ui.row, { justifyContent: "space-between", marginBottom: 22 }]}
      >
        <Text style={[ui.eyebrow, { marginBottom: 0 }]}>
          HEADS UP / STUDY CLUB
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Game settings"
          onPress={() => router.push("/settings")}
          style={{ padding: 10 }}
        >
          <Icon name="options-outline" />
        </Pressable>
      </View>
      <Pop>
        <Panel color={palette.blue}>
          <DeckArt />
          <Text
            style={[
              ui.title,
              {
                color: "#FFF",
                textAlign: "center",
                fontSize: 42,
                lineHeight: 46,
              },
            ]}
          >
            Big clues.{"\n"}Bright minds.
          </Text>
          <Text
            style={[
              ui.body,
              { color: "#FFF", textAlign: "center", marginBottom: 18 },
            ]}
          >
            Turn your class notes into your next game night.
          </Text>
          <Button
            tone="yellow"
            label="Try a quick round"
            icon="play"
            onPress={() => open("/game", SAMPLE_CARDS)}
          />
        </Panel>
      </Pop>
      <Heading
        eyebrow="MAKE IT YOURS"
        title="Notes in. Game on."
        subtitle="Bring the vocabulary. Your friends bring the clues."
      />
      <Panel>
        <Text style={ui.section}>Build a study deck</Text>
        <View style={[ui.row, { marginBottom: 18 }]}>
          {MODES.map((m) => (
            <Pressable
              key={m.key}
              accessibilityRole="button"
              accessibilityState={{
                selected: mode === m.key,
                disabled: loading,
              }}
              disabled={loading}
              onPress={() => setMode(m.key)}
              style={[
                ui.chip,
                { flex: 1, gap: 5 },
                mode === m.key && ui.selected,
              ]}
            >
              <Icon name={m.icon} />
              <Text style={ui.chipText}>{m.label}</Text>
            </Pressable>
          ))}
        </View>
        {mode === "type" ? (
          <TextInput
            accessibilityLabel="Class notes"
            multiline
            textAlignVertical="top"
            value={text}
            onChangeText={setText}
            placeholder="Paste your notes here…\n\nGravity: the force that pulls objects together.\nMetaphor: comparing one thing to another."
            placeholderTextColor={palette.muted}
            style={[ui.input, { minHeight: 180, lineHeight: 24 }]}
          />
        ) : (
          <View style={{ alignItems: "center", paddingVertical: 24 }}>
            <Icon
              name={mode === "pdf" ? "document-text-outline" : "camera-outline"}
              size={48}
              color={palette.blue}
            />
            <Text style={ui.body}>
              {mode === "pdf"
                ? "Lecture slides, study guides, or textbook pages."
                : "Pick a photo of handwritten or printed notes."}
            </Text>
          </View>
        )}
        {loading && (
          <View style={[ui.row, { marginBottom: 14 }]}>
            <ActivityIndicator color={palette.blue} />
            <Text style={ui.body}>Making your next great deck…</Text>
          </View>
        )}
        <Button
          label={
            loading
              ? "Creating cards…"
              : mode === "type"
                ? "Make my flashcards"
                : mode === "pdf"
                  ? "Choose a PDF"
                  : "Choose a photo"
          }
          icon="flash-outline"
          disabled={loading}
          onPress={generate}
        />
        {!!notice && (
          <Text accessibilityLiveRegion="polite" style={ui.body}>
            {notice}
          </Text>
        )}
      </Panel>
      {cards.length > 0 ? (
        <Pop trigger={cards.length}>
          <Panel color={palette.lilac}>
            <Text style={ui.section}>{cards.length} cards. Let’s play.</Text>
            <TextInput
              accessibilityLabel="Deck name"
              style={ui.input}
              value={setName}
              onChangeText={setSetName}
              placeholder="Name your deck"
              placeholderTextColor={palette.muted}
            />
            <Button
              label="Save deck"
              icon="bookmark-outline"
              tone="light"
              onPress={save}
            />
            <Button
              label="Start the game"
              icon="play"
              tone="green"
              onPress={() => open("/game")}
            />
            <Button
              label="Practice at my pace"
              icon="layers-outline"
              onPress={() => open("/review")}
            />
            {cards.map((card, i) => (
              <View
                key={i}
                style={{
                  borderTopWidth: 1,
                  borderColor: "#CDD0E2",
                  paddingVertical: 14,
                }}
              >
                <Text style={[ui.chipText, { fontSize: 17 }]}>{card.term}</Text>
                <Text style={ui.body}>{card.definition}</Text>
              </View>
            ))}
          </Panel>
        </Pop>
      ) : (
        <Panel color={palette.yellow}>
          <Text style={ui.section}>A little teamwork. A lot of learning.</Text>
          {[
            "Add your notes and make a deck.",
            "Hold the screen up. Friends give clues.",
            "Guess, tilt, repeat. Beat your best!",
          ].map((step, i) => (
            <View key={step} style={[ui.row, { marginBottom: 13 }]}>
              <View
                style={[
                  ui.chip,
                  { backgroundColor: "#FFF", borderColor: palette.ink },
                ]}
              >
                <Text style={ui.chipText}>{i + 1}</Text>
              </View>
              <Text
                style={[ui.body, { flex: 1, color: palette.ink, marginTop: 0 }]}
              >
                {step}
              </Text>
            </View>
          ))}
        </Panel>
      )}
    </Page>
  );
}
