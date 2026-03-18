import * as React from "react";
import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Accelerometer } from "expo-sensors";
import { useLocalSearchParams, useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");
const TIMER_DURATION = 60;
const TILT_THRESHOLD = 0.6;

export default function GameScreen() {
  const { cards: cardsParam } = useLocalSearchParams();
  const router = useRouter();
  const cards = cardsParam ? JSON.parse(cardsParam as string) : [];

  useEffect(() => {
    if (!cards.length) {
      router.replace("/");
    }
  }, []);

  if (!cards.length) return null;

  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<string[]>([]);
  const [tiltLocked, setTiltLocked] = useState(false);
  const [feedback, setFeedback] = useState<null | "correct" | "pass">(null);

  const tiltLockedRef = useRef(false);

  // timer
  useEffect(() => {
    if (timeLeft <= 0) {
      router.replace({
        pathname: "/results" as any,
        params: { score: String(score), missed: JSON.stringify(missed) },
      });
      return;
    }
    const t = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  // accelerometer
  useEffect(() => {
    Accelerometer.setUpdateInterval(300);
    const sub = Accelerometer.addListener(({ z }) => {
      if (tiltLockedRef.current) return;
      if (z < -TILT_THRESHOLD) {
        handleAction("correct");
      } else if (z > TILT_THRESHOLD) {
        handleAction("pass");
      }
    });
    return () => sub.remove();
  }, []);

  function handleAction(action: "correct" | "pass") {
    tiltLockedRef.current = true;
    setTiltLocked(true);
    setFeedback(action);

    const newScore = action === "correct" ? score + 1 : score;
    const newMissed = action === "pass" ? [...missed, cards[index].term] : missed;

    setScore(newScore);
    setMissed(newMissed);

    setTimeout(() => {
      tiltLockedRef.current = false;
      setTiltLocked(false);
      setFeedback(null);
      if (index + 1 >= cards.length) {
        router.replace({
          pathname: "/results" as any,
          params: { score: String(newScore), missed: JSON.stringify(newMissed) },
        });
      } else {
        setIndex((i) => i + 1);
      }
    }, 800);
  }

  const card = cards[index];

  return (
    <View style={[styles.container, feedback === "correct" ? styles.green : feedback === "pass" ? styles.red : styles.default]}>
      <Text style={styles.timer}>{timeLeft}s</Text>
      <Text style={styles.score}>Score: {score}</Text>
      <Text style={styles.term}>{card.term}</Text>
      <Text style={styles.definition}>{card.definition}</Text>
      {feedback && (
        <Text style={styles.feedback}>
          {feedback === "correct" ? "✓ Got it!" : "✗ Pass"}
        </Text>
      )}
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.passBtn} onPress={() => handleAction("pass")}>
          <Text style={styles.btnText}>Pass</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.gotBtn} onPress={() => handleAction("correct")}>
          <Text style={styles.btnText}>Got it</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>Tilt down = pass · Tilt up = got it</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  default: { backgroundColor: "#6C63FF" },
  green: { backgroundColor: "#2ecc71" },
  red: { backgroundColor: "#e74c3c" },
  timer: { position: "absolute", top: 60, fontSize: 24, color: "#fff", fontWeight: "bold" },
  score: { position: "absolute", top: 60, right: 24, fontSize: 18, color: "#fff" },
  term: { fontSize: 48, fontWeight: "bold", color: "#fff", textAlign: "center", marginBottom: 16 },
  definition: { fontSize: 18, color: "rgba(255,255,255,0.8)", textAlign: "center", marginBottom: 40 },
  feedback: { fontSize: 36, color: "#fff", fontWeight: "bold", marginBottom: 20 },
  buttons: { flexDirection: "row", gap: 20 },
  passBtn: { backgroundColor: "rgba(0,0,0,0.2)", padding: 16, borderRadius: 12, width: 120, alignItems: "center" },
  gotBtn: { backgroundColor: "rgba(255,255,255,0.2)", padding: 16, borderRadius: 12, width: 120, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  hint: { position: "absolute", bottom: 40, color: "rgba(255,255,255,0.6)", fontSize: 13 },
});
