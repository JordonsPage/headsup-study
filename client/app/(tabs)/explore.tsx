import React, { useCallback, useState } from "react";
import { Alert, Text, View, Pressable } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
} from "@/components/play-ui";
import { type CardSet, parseCards, SETS_KEY } from "@/lib/cards";
export default function MyDecks() {
  const [sets, setSets] = useState<CardSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      AsyncStorage.getItem(SETS_KEY)
        .then((raw) => {
          const value = raw ? JSON.parse(raw) : [];
          if (!Array.isArray(value)) throw new Error("Invalid decks");
          if (active) {
            setSets(
              value
                .filter(
                  (s) =>
                    s && typeof s.id === "string" && typeof s.name === "string",
                )
                .map((s) => ({ ...s, cards: parseCards(s.cards) })),
            );
            setError("");
          }
        })
        .catch(() => {
          if (active)
            setError(
              "Could not load your decks. Please reopen this tab to try again.",
            );
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, []),
  );
  function remove(set: CardSet) {
    Alert.alert("Delete deck?", `Remove “${set.name}” from this device?`, [
      { text: "Keep it", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const raw = await AsyncStorage.getItem(SETS_KEY);
            const latest: CardSet[] = raw ? JSON.parse(raw) : [];
            const next = latest.filter((s) => s.id !== set.id);
            await AsyncStorage.setItem(SETS_KEY, JSON.stringify(next));
            setSets(next);
          } catch {
            setError("Could not delete that deck. Please try again.");
          }
        },
      },
    ]);
  }
  return (
    <Page>
      <Heading
        eyebrow="THE DECK SHELF"
        title="Your next good round."
        subtitle="All your saved study sets, ready for another go."
      />
      {error && (
        <Text accessibilityRole="alert" style={ui.body}>
          {error}
        </Text>
      )}
      {loading ? (
        <Text style={ui.body}>Loading your decks…</Text>
      ) : !sets.length ? (
        <Panel color={palette.yellow}>
          <DeckArt />
          <Text style={ui.section}>Your shelf starts here.</Text>
          <Text style={[ui.body, { marginBottom: 18 }]}>
            Create a deck from your notes, then save it for next time.
          </Text>
          <Button
            label="Make my first deck"
            icon="add"
            onPress={() => router.navigate("/")}
          />
        </Panel>
      ) : (
        sets.map((set, i) => (
          <Pop key={set.id}>
            <Panel color={["#FFF", "#EEE8FF", "#E3F5EE"][i % 3]}>
              <View style={[ui.row, { justifyContent: "space-between" }]}>
                <View style={{ flex: 1 }}>
                  <Text style={ui.section}>{set.name}</Text>
                  <Text style={ui.eyebrow}>{set.cards.length} CARDS</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${set.name}`}
                  onPress={() => remove(set)}
                  style={{ padding: 12 }}
                >
                  <Icon name="trash-outline" color={palette.muted} />
                </Pressable>
              </View>
              <Text style={[ui.body, { marginBottom: 20 }]}>
                {set.cards
                  .slice(0, 3)
                  .map((c) => c.term)
                  .join(" / ")}
              </Text>
              <Button
                label="Play this deck"
                icon="play"
                disabled={!set.cards.length}
                onPress={() =>
                  router.push({
                    pathname: "/game",
                    params: { cards: JSON.stringify(set.cards) },
                  })
                }
              />
              <Button
                label="Practice cards"
                tone="light"
                icon="layers-outline"
                disabled={!set.cards.length}
                onPress={() =>
                  router.push({
                    pathname: "/review",
                    params: { cards: JSON.stringify(set.cards) },
                  })
                }
              />
            </Panel>
          </Pop>
        ))
      )}
    </Page>
  );
}
