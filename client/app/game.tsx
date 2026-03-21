import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Accelerometer } from "expo-sensors";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TILT_THRESHOLD = 0.6;
const SETTINGS_KEY = "headsup_settings";
const DEFAULT_SETTINGS = { timerDuration: 60, numberOfCards: 0 };

export default function GameScreen() {
  const { cards: cardsParam } = useLocalSearchParams();
  const router = useRouter();
  const rawCards = cardsParam ? JSON.parse(cardsParam as string) : [];

  const [cards, setCards] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<{ term: string; definition: string }[]>([]);
  const [feedback, setFeedback] = useState<null | "correct" | "pass">(null);
  const [ready, setReady] = useState(false);

  // Refs to avoid stale closures in accelerometer
  const tiltLockedRef = useRef(false);
  const indexRef = useRef(0);
  const scoreRef = useRef(0);
  const missedRef = useRef<{ term: string; definition: string }[]>([]);
  const cardsRef = useRef<any[]>([]);

  useEffect(() => {
    if (!rawCards.length) {
      router.replace("/");
      return;
    }
    loadSettingsAndInit();
  }, []);

  async function loadSettingsAndInit() {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      const settings = data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;

      let loaded = [...rawCards].sort(() => Math.random() - 0.5);
      if (settings.numberOfCards > 0 && settings.numberOfCards < loaded.length) {
        loaded = loaded.slice(0, settings.numberOfCards);
      }

      cardsRef.current = loaded;
      setCards(loaded);
      setTimeLeft(settings.timerDuration);
      setReady(true);
    } catch (e) {
      cardsRef.current = rawCards;
      setCards(rawCards);
      setTimeLeft(DEFAULT_SETTINGS.timerDuration);
      setReady(true);
    }
  }

  // Timer
  useEffect(() => {
    if (!ready || cards.length === 0) return;
    if (timeLeft <= 0) {
      router.replace({
        pathname: "/results" as any,
        params: { score: String(scoreRef.current), missed: JSON.stringify(missedRef.current) },
      });
      return;
    }
    const t = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, ready, cards]);

  // Accelerometer — uses refs so it never goes stale
  useEffect(() => {
    Accelerometer.setUpdateInterval(300);
    const sub = Accelerometer.addListener(({ z }) => {
      if (tiltLockedRef.current) return;
      if (z < -TILT_THRESHOLD) handleAction("correct");
      else if (z > TILT_THRESHOLD) handleAction("pass");
    });
    return () => sub.remove();
  }, []);

  function handleAction(action: "correct" | "pass") {
    if (tiltLockedRef.current) return;
    tiltLockedRef.current = true;
    setFeedback(action);

    const newScore = action === "correct" ? scoreRef.current + 1 : scoreRef.current;
    const newMissed = action === "pass"
      ? [...missedRef.current, { term: cardsRef.current[indexRef.current].term, definition: cardsRef.current[indexRef.current].definition }]
      : missedRef.current;

    scoreRef.current = newScore;
    missedRef.current = newMissed;
    setScore(newScore);
    setMissed(newMissed);

    setTimeout(() => {
      tiltLockedRef.current = false;
      setFeedback(null);

      const nextIndex = indexRef.current + 1;
      if (nextIndex >= cardsRef.current.length) {
        router.replace({
          pathname: "/results" as any,
          params: { score: String(newScore), missed: JSON.stringify(newMissed) },
        });
      } else {
        indexRef.current = nextIndex;
        setIndex(nextIndex);
      }
    }, 800);
  }

  if (!ready || cards.length === 0) return null;

  const card = cards[index];
  const progress = ((index + 1) / cards.length) * 100;
  const timerColor = timeLeft <= 10 ? "#e74c3c" : "#fff";

  return (
    <View style={[
      styles.container,
      feedback === "correct" ? styles.green : feedback === "pass" ? styles.red : styles.default,
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/")}>
          <Text style={styles.exitBtn}>✕ Exit</Text>
        </TouchableOpacity>
        <Text style={[styles.timer, { color: timerColor }]}>{timeLeft}s</Text>
        <Text style={styles.score}>{score}/{cards.length}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      {/* Card */}
      <View style={styles.cardArea}>
        <Text style={styles.cardCounter}>Card {index + 1} of {cards.length}</Text>
        <Text style={styles.term}>{card.term}</Text>
        <Text style={styles.definition}>{card.definition}</Text>
        {feedback && (
          <Text style={styles.feedback}>
            {feedback === "correct" ? "✓ Got it!" : "✗ Pass"}
          </Text>
        )}
      </View>

      {/* Buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.passBtn} onPress={() => handleAction("pass")}>
          <Text style={styles.btnText}>✗ Pass</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.gotBtn} onPress={() => handleAction("correct")}>
          <Text style={styles.btnText}>✓ Got it</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>Tilt down = pass · Tilt up = got it</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, padding: 20 },
  default: { backgroundColor: "#6C63FF" },
  green: { backgroundColor: "#2ecc71" },
  red: { backgroundColor: "#e74c3c" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  exitBtn: { color: "rgba(255,255,255,0.8)", fontSize: 15, fontWeight: "600" },
  timer: { fontSize: 26, fontWeight: "bold", color: "#fff" },
  score: { fontSize: 16, color: "#fff" },
  progressBar: { height: 4, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 2, marginBottom: 32 },
  progressFill: { height: 4, backgroundColor: "#fff", borderRadius: 2 },
  cardArea: { flex: 1, alignItems: "center", justifyContent: "center" },
  cardCounter: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginBottom: 16 },
  term: { fontSize: 48, fontWeight: "bold", color: "#fff", textAlign: "center", marginBottom: 16 },
  definition: { fontSize: 18, color: "rgba(255,255,255,0.85)", textAlign: "center", marginBottom: 24, paddingHorizontal: 16 },
  feedback: { fontSize: 36, color: "#fff", fontWeight: "bold" },
  buttons: { flexDirection: "row", gap: 16, marginBottom: 16 },
  passBtn: { flex: 1, backgroundColor: "rgba(0,0,0,0.25)", padding: 18, borderRadius: 14, alignItems: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" },
  gotBtn: { flex: 1, backgroundColor: "rgba(255,255,255,0.25)", padding: 18, borderRadius: 14, alignItems: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.5)" },
  btnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  hint: { textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 20 },
});
