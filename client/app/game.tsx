import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Accelerometer } from "expo-sensors";
import { useRouter } from "expo-router";
import { useCardGame } from "@/hooks/use-card-game";

const TILT_THRESHOLD = 0.5;

export default function GameScreen() {
  const router = useRouter();
  const game = useCardGame();

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "pass" | null>(null);

  // Prevents double-tap and accelerometer double-fire
  const actionPending = useRef(false);
  // Mirror timeLeft for timer callback (avoids stale closure)
  const timeLeftRef = useRef<number>(0);

  // Start timer once cards are ready
  useEffect(() => {
    if (!game.ready) return;
    setTimeLeft(game.settings.timerDuration);
    timeLeftRef.current = game.settings.timerDuration;
  }, [game.ready]);

  // Countdown — runs independently from card navigation
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const t = setTimeout(() => {
      const next = timeLeft - 1;
      timeLeftRef.current = next;
      setTimeLeft(next);
      if (next <= 0) {
        game.finish();
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  // Accelerometer — only reads refs, never stale
  useEffect(() => {
    if (!game.ready) return;
    Accelerometer.setUpdateInterval(300);
    const sub = Accelerometer.addListener(({ z }) => {
      if (actionPending.current) return;
      if (z < -TILT_THRESHOLD) handleAction("correct");
      else if (z > TILT_THRESHOLD) handleAction("pass");
    });
    return () => sub.remove();
  }, [game.ready]);

  function handleAction(action: "correct" | "pass") {
    if (actionPending.current || !game.currentCard) return;
    actionPending.current = true;

    // Show feedback flash
    setFeedback(action);

    // Record the answer in the game engine
    const done = game.answer(action);

    setTimeout(() => {
      setFeedback(null);
      actionPending.current = false;
      if (done) {
        game.finish();
      }
    }, 600);
  }

  if (!game.ready || !game.currentCard) return null;

  const timerWarning = timeLeft !== null && timeLeft <= 10;

  return (
    <View
      style={[
        styles.container,
        feedback === "correct"
          ? styles.bgCorrect
          : feedback === "pass"
          ? styles.bgPass
          : styles.bgDefault,
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/")}>
          <Text style={styles.exitBtn}>✕ Exit</Text>
        </TouchableOpacity>
        <Text style={[styles.timer, timerWarning && styles.timerWarning]}>
          {timeLeft ?? "--"}s
        </Text>
        <Text style={styles.scoreBadge}>
          {game.score}/{game.totalCards}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${game.progress}%` }]} />
      </View>

      {/* Card */}
      <View style={styles.cardArea}>
        <Text style={styles.cardCounter}>
          Card {game.index + 1} of {game.totalCards}
        </Text>
        <Text style={styles.term}>{game.currentCard.term}</Text>
        <Text style={styles.definition}>{game.currentCard.definition}</Text>
        {feedback && (
          <Text style={styles.feedbackText}>
            {feedback === "correct" ? "✓ Got it!" : "✗ Pass"}
          </Text>
        )}
      </View>

      {/* Buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.passBtn}
          onPress={() => handleAction("pass")}
          activeOpacity={0.7}
        >
          <Text style={styles.btnText}>✗ Pass</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.gotBtn}
          onPress={() => handleAction("correct")}
          activeOpacity={0.7}
        >
          <Text style={styles.btnText}>✓ Got it</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>Tilt forward = pass · Tilt back = got it</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  bgDefault: { backgroundColor: "#6C63FF" },
  bgCorrect: { backgroundColor: "#2ecc71" },
  bgPass: { backgroundColor: "#e74c3c" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  exitBtn: { color: "rgba(255,255,255,0.8)", fontSize: 15, fontWeight: "600" },
  timer: { fontSize: 28, fontWeight: "bold", color: "#fff" },
  timerWarning: { color: "#ffe066" },
  scoreBadge: { fontSize: 16, color: "#fff" },

  progressBar: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    marginBottom: 32,
  },
  progressFill: { height: 4, backgroundColor: "#fff", borderRadius: 2 },

  cardArea: { flex: 1, alignItems: "center", justifyContent: "center" },
  cardCounter: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    marginBottom: 20,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  term: {
    fontSize: 44,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
  },
  definition: {
    fontSize: 18,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  feedbackText: { fontSize: 32, color: "#fff", fontWeight: "bold" },

  buttons: { flexDirection: "row", gap: 16, marginBottom: 14 },
  passBtn: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  gotBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.25)",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  btnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  hint: {
    textAlign: "center",
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    marginBottom: 4,
  },
});
