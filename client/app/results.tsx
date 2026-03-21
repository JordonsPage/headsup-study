import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function ResultsScreen() {
  const { score, missed, total } = useLocalSearchParams();
  const router = useRouter();

  const missedCards: { term: string; definition: string }[] = missed ? JSON.parse(missed as string) : [];
  const scoreNum = Number(score);
  const totalNum = Number(total) || scoreNum + missedCards.length;
  const pct = totalNum > 0 ? Math.round((scoreNum / totalNum) * 100) : 0;

  function getEmoji() {
    if (pct >= 90) return "🏆";
    if (pct >= 70) return "🎉";
    if (pct >= 50) return "💪";
    return "📖";
  }

  function getMessage() {
    if (pct >= 90) return "Crushing it!";
    if (pct >= 70) return "Nice work!";
    if (pct >= 50) return "Keep going!";
    return "Keep studying!";
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <Text style={styles.emoji}>{getEmoji()}</Text>
      <Text style={styles.title}>Round Over!</Text>
      <Text style={styles.message}>{getMessage()}</Text>

      {/* Score card */}
      <View style={styles.scoreCard}>
        <Text style={styles.pct}>{pct}%</Text>
        <Text style={styles.scoreDetail}>
          {scoreNum} correct out of {totalNum}
        </Text>

        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: "#eafaf1" }]}>
            <Text style={styles.statNum}>{scoreNum}</Text>
            <Text style={styles.statLabel}>Got it ✓</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: "#fef9e7" }]}>
            <Text style={styles.statNum}>{missedCards.length}</Text>
            <Text style={styles.statLabel}>Missed ✗</Text>
          </View>
        </View>
      </View>

      {/* Missed terms */}
      {missedCards.length > 0 && (
        <View style={styles.missedSection}>
          <Text style={styles.missedTitle}>Missed Terms</Text>
          {missedCards.map((card, i: number) => (
            <View key={i} style={styles.missedCard}>
              <Text style={styles.missedTerm}>{card.term}</Text>
              <Text style={styles.missedDef}>{card.definition}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {missedCards.length > 0 && (
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "#e67e22" }]}
            onPress={() =>
              router.replace({
                pathname: "/review" as any,
                params: { cards: JSON.stringify(missedCards) },
              })
            }
          >
            <Text style={styles.btnText}>📖 Review Missed</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: "#6C63FF" }]}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.btnText}>🏠 Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: "#2ecc71" }]}
          onPress={() => router.replace("/my-sets" as any)}
        >
          <Text style={styles.btnText}>📚 My Sets</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 80,
    backgroundColor: "#f8f7ff",
    flexGrow: 1,
    alignItems: "center",
  },

  emoji: { fontSize: 64, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: "bold", color: "#333", marginBottom: 4 },
  message: { fontSize: 16, color: "#888", marginBottom: 24 },

  scoreCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  pct: { fontSize: 64, fontWeight: "bold", color: "#6C63FF" },
  scoreDetail: { fontSize: 15, color: "#888", marginBottom: 20 },

  statsRow: { flexDirection: "row", gap: 16, width: "100%" },
  statBox: { flex: 1, padding: 16, borderRadius: 12, alignItems: "center" },
  statNum: { fontSize: 28, fontWeight: "bold", color: "#333" },
  statLabel: { fontSize: 13, color: "#666", marginTop: 4 },

  missedSection: { width: "100%", marginBottom: 24 },
  missedTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e74c3c",
    marginBottom: 12,
  },
  missedCard: {
    backgroundColor: "#ffeaea",
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  missedTerm: { fontSize: 15, color: "#c0392b", fontWeight: "600" },
  missedDef: { fontSize: 13, color: "#888", marginTop: 4 },

  actions: { width: "100%", gap: 12, marginBottom: 40 },
  btn: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
