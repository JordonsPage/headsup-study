import React, { useState, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useFocusEffect } from "expo-router";

const CARD_SETS_KEY = "card_sets";

interface CardSet {
  id: string;
  name: string;
  cards: { term: string; definition: string }[];
  createdAt: number;
}

export default function MySetsTab() {
  const [sets, setSets] = useState<CardSet[]>([]);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      loadSets();
    }, [])
  );

  async function loadSets() {
    try {
      const data = await AsyncStorage.getItem(CARD_SETS_KEY);
      setSets(data ? JSON.parse(data) : []);
    } catch (e) {
      console.error("Failed to load sets", e);
    }
  }

  async function handleDelete(id: string, name: string) {
    Alert.alert("Delete Set", `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const updated = sets.filter((s) => s.id !== id);
            await AsyncStorage.setItem(CARD_SETS_KEY, JSON.stringify(updated));
            setSets(updated);
          } catch (e) {
            Alert.alert("Error", "Could not delete set.");
          }
        },
      },
    ]);
  }

  function formatDate(timestamp: number) {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>My Sets</Text>

      {sets.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>No saved sets yet</Text>
          <Text style={styles.emptySubtitle}>
            Generate flashcards on the Home tab and save them here
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.count}>{sets.length} saved set{sets.length !== 1 ? "s" : ""}</Text>
          {sets.map((set) => (
            <View key={set.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.setName}>{set.name}</Text>
                  <Text style={styles.setMeta}>
                    {set.cards.length} cards · {formatDate(set.createdAt)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(set.id, set.name)}
                  style={styles.deleteBtn}
                >
                  <Text style={styles.deleteBtnText}>🗑</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.preview}>
                {set.cards.slice(0, 2).map((card, i) => (
                  <Text key={i} style={styles.previewText} numberOfLines={1}>
                    • {card.term}
                  </Text>
                ))}
                {set.cards.length > 2 && (
                  <Text style={styles.previewMore}>
                    +{set.cards.length - 2} more...
                  </Text>
                )}
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#2ecc71" }]}
                  onPress={() =>
                    router.push({
                      pathname: "/heads-up" as any,
                      params: { cards: JSON.stringify(set.cards) },
                    })
                  }
                >
                  <Text style={styles.actionBtnText}>🎮 Game</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#3498db" }]}
                  onPress={() =>
                    router.push({
                      pathname: "/review" as any,
                      params: { cards: JSON.stringify(set.cards) },
                    })
                  }
                >
                  <Text style={styles.actionBtnText}>📖 Review</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, backgroundColor: "#f8f7ff", flexGrow: 1 },
  title: { fontSize: 28, fontWeight: "bold", color: "#333", marginBottom: 20 },
  count: { fontSize: 13, color: "#888", marginBottom: 16 },

  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "bold", color: "#333", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#888", textAlign: "center", paddingHorizontal: 20 },

  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  setName: { fontSize: 17, fontWeight: "bold", color: "#333" },
  setMeta: { fontSize: 12, color: "#888", marginTop: 2 },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: 18 },

  preview: { backgroundColor: "#f8f7ff", borderRadius: 8, padding: 10, marginBottom: 12 },
  previewText: { fontSize: 13, color: "#555", marginBottom: 2 },
  previewMore: { fontSize: 12, color: "#aaa", marginTop: 2 },

  actions: { flexDirection: "row", gap: 10 },
  actionBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: "center" },
  actionBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
});
