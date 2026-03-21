import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function ReviewScreen() {
  const { cards: cardsParam } = useLocalSearchParams();
  const router = useRouter();
  const cards = cardsParam ? JSON.parse(cardsParam as string) : [];

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<number[]>([]);
  const [unsure, setUnsure] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!cards.length) router.replace("/");
  }, []);

  if (!cards.length) return null;

  const card = cards[index];
  const progress = ((index + 1) / cards.length) * 100;

  function handleKnow() {
    setKnown((prev) => [...prev, index]);
    advance();
  }

  function handleUnsure() {
    setUnsure((prev) => [...prev, index]);
    advance();
  }

  function advance() {
    setFlipped(false);
    if (index + 1 >= cards.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
    }
  }

  function handleRestart() {
    setIndex(0);
    setFlipped(false);
    setKnown([]);
    setUnsure([]);
    setDone(false);
  }

  function handleReviewMissed() {
    const missedCards = unsure.map((i) => cards[i]);
    setIndex(0);
    setFlipped(false);
    setKnown([]);
    setUnsure([]);
    setDone(false);
    // Re-route with only missed cards
    router.replace({
      pathname: "/review" as any,
      params: { cards: JSON.stringify(missedCards) },
    });
  }

  if (done) {
    return (
      <View style={styles.container}>
        <View style={styles.resultsCard}>
          <Text style={styles.resultsEmoji}>🎉</Text>
          <Text style={styles.resultsTitle}>Review Complete!</Text>
          <Text style={styles.resultsSub}>
            {cards.length} cards reviewed
          </Text>

          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: "#eafaf1" }]}>
              <Text style={styles.statNum}>{known.length}</Text>
              <Text style={styles.statLabel}>Got it ✓</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: "#fef9e7" }]}>
              <Text style={styles.statNum}>{unsure.length}</Text>
              <Text style={styles.statLabel}>Still learning</Text>
            </View>
          </View>

          {unsure.length > 0 && (
            <>
              <Text style={styles.missedTitle}>Still Learning:</Text>
              <ScrollView style={styles.missedList}>
                {unsure.map((i) => (
                  <View key={i} style={styles.missedCard}>
                    <Text style={styles.missedTerm}>{cards[i].term}</Text>
                    <Text style={styles.missedDef}>{cards[i].definition}</Text>
                  </View>
                ))}
              </ScrollView>
            </>
          )}

          <View style={styles.resultActions}>
            {unsure.length > 0 && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#e67e22" }]}
                onPress={handleReviewMissed}
              >
                <Text style={styles.actionBtnText}>📖 Review Missed</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#6C63FF" }]}
              onPress={handleRestart}
            >
              <Text style={styles.actionBtnText}>🔄 Start Over</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#95a5a6" }]}
              onPress={() => router.replace("/")}
            >
              <Text style={styles.actionBtnText}>🏠 Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/")}>
          <Text style={styles.exitBtn}>✕ Exit</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Mode</Text>
        <Text style={styles.counter}>{index + 1}/{cards.length}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      {/* Card */}
      <TouchableOpacity
        style={[styles.card, flipped && styles.cardFlipped]}
        onPress={() => setFlipped(!flipped)}
        activeOpacity={0.9}
      >
        <Text style={styles.cardHint}>
          {flipped ? "Definition" : "Term — tap to reveal"}
        </Text>
        <Text style={[styles.cardText, flipped && styles.cardTextFlipped]}>
          {flipped ? card.definition : card.term}
        </Text>
        {!flipped && (
          <Text style={styles.tapHint}>👆 Tap to flip</Text>
        )}
      </TouchableOpacity>

      {/* Action buttons - only show after flip */}
      {flipped ? (
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "#e74c3c" }]}
            onPress={handleUnsure}
          >
            <Text style={styles.btnText}>😕 Still Learning</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "#2ecc71" }]}
            onPress={handleKnow}
          >
            <Text style={styles.btnText}>✓ Got it!</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "#bdc3c7", flex: 1 }]}
            onPress={() => setFlipped(true)}
          >
            <Text style={styles.btnText}>Reveal Answer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Known/unsure tracker */}
      <View style={styles.tracker}>
        <Text style={styles.trackerText}>✓ {known.length} known</Text>
        <Text style={styles.trackerText}>~ {unsure.length} still learning</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f7ff", paddingTop: 60, padding: 20 },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  exitBtn: { fontSize: 15, color: "#e74c3c", fontWeight: "600" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  counter: { fontSize: 15, color: "#888" },

  progressBar: { height: 6, backgroundColor: "#e0e0ff", borderRadius: 3, marginBottom: 24 },
  progressFill: { height: 6, backgroundColor: "#6C63FF", borderRadius: 3 },

  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#e0e0ff",
  },
  cardFlipped: { borderColor: "#6C63FF", backgroundColor: "#f0eeff" },
  cardHint: { fontSize: 12, color: "#aaa", marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 },
  cardText: { fontSize: 36, fontWeight: "bold", color: "#333", textAlign: "center" },
  cardTextFlipped: { fontSize: 22, fontWeight: "normal", color: "#555" },
  tapHint: { marginTop: 24, fontSize: 13, color: "#bbb" },

  buttons: { flexDirection: "row", gap: 12, marginBottom: 16 },
  btn: { flex: 1, padding: 16, borderRadius: 12, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },

  tracker: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 },
  trackerText: { fontSize: 13, color: "#888" },

  // Results
  resultsCard: { flex: 1, backgroundColor: "#fff", borderRadius: 20, padding: 24, alignItems: "center" },
  resultsEmoji: { fontSize: 60, marginBottom: 12 },
  resultsTitle: { fontSize: 28, fontWeight: "bold", color: "#333", marginBottom: 4 },
  resultsSub: { fontSize: 15, color: "#888", marginBottom: 24 },

  statsRow: { flexDirection: "row", gap: 16, marginBottom: 24, width: "100%" },
  statBox: { flex: 1, padding: 16, borderRadius: 12, alignItems: "center" },
  statNum: { fontSize: 32, fontWeight: "bold", color: "#333" },
  statLabel: { fontSize: 13, color: "#666", marginTop: 4 },

  missedTitle: { fontSize: 16, fontWeight: "bold", color: "#333", alignSelf: "flex-start", marginBottom: 8 },
  missedList: { width: "100%", maxHeight: 200, marginBottom: 20 },
  missedCard: { backgroundColor: "#fef9e7", padding: 12, borderRadius: 10, marginBottom: 8 },
  missedTerm: { fontSize: 15, fontWeight: "bold", color: "#e67e22" },
  missedDef: { fontSize: 13, color: "#555", marginTop: 4 },

  resultActions: { width: "100%", gap: 10 },
  actionBtn: { padding: 14, borderRadius: 12, alignItems: "center" },
  actionBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});
