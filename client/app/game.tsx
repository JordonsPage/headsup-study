import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Accelerometer } from "expo-sensors";
import { Button, DeckArt, Icon, Pop, palette, ui } from "@/components/play-ui";
import { useCardGame } from "@/hooks/use-card-game";
export default function GameScreen() {
  const game = useCardGame();
  const router = useRouter();
  const { answer, finish } = game;
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "pass" | null>(null);
  const [sensor, setSensor] = useState(false);
  const deadline = useRef(0);
  const pending = useRef(false);
  const armed = useRef(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    },
    [],
  );
  const handleAction = useCallback(
    (action: "correct" | "pass") => {
      if (pending.current || !started || Date.now() >= deadline.current) return;
      pending.current = true;
      armed.current = false;
      setFeedback(action);
      const done = answer(action);
      feedbackTimer.current = setTimeout(() => {
        setFeedback(null);
        if (done) finish();
        else pending.current = false;
      }, 500);
    },
    [started, answer, finish],
  );
  useEffect(() => {
    if (!started) return;
    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((deadline.current - Date.now()) / 1000),
      );
      setTimeLeft(remaining);
      if (!remaining) {
        pending.current = true;
        finish();
      }
    };
    tick();
    const timer = setInterval(tick, 200);
    return () => clearInterval(timer);
  }, [started, finish]);
  useEffect(() => {
    if (!started) return;
    let active = true;
    let subscription: ReturnType<typeof Accelerometer.addListener> | undefined;
    Accelerometer.isAvailableAsync()
      .then((available) => {
        if (!active || !available) return;
        setSensor(true);
        Accelerometer.setUpdateInterval(100);
        subscription = Accelerometer.addListener(({ z }) => {
          if (Math.abs(z) < 0.25) {
            armed.current = true;
            return;
          }
          if (!armed.current || pending.current) return;
          if (z < -0.65) handleAction("correct");
          else if (z > 0.65) handleAction("pass");
        });
      })
      .catch(() => {
        if (active) setSensor(false);
      });
    return () => {
      active = false;
      subscription?.remove();
    };
  }, [started, handleAction]);
  if (!game.ready)
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator color={palette.blue} />
        <Text style={ui.body}>Shuffling your deck…</Text>
      </SafeAreaView>
    );
  if (!started)
    return (
      <SafeAreaView style={styles.ready}>
        <View style={styles.width}>
          <DeckArt />
          <Text style={[ui.eyebrow, { textAlign: "center" }]}>
            GATHER YOUR CLUE CREW
          </Text>
          <Text style={[ui.title, { textAlign: "center" }]}>
            Ready, set,{"\n"}heads up!
          </Text>
          <Text style={[ui.body, { textAlign: "center", marginBottom: 28 }]}>
            {game.totalCards} cards. {game.settings.timerDuration} seconds. Hold
            the screen toward your friends so they can give clues. You guess the
            term! Tilt back for “Got it,” forward to pass, then return upright.
          </Text>
          <Button
            label="Let’s play!"
            icon="play"
            tone="yellow"
            onPress={() => {
              deadline.current =
                Date.now() + game.settings.timerDuration * 1000;
              setTimeLeft(game.settings.timerDuration);
              setStarted(true);
            }}
          />
          <Button
            label="Back to decks"
            tone="light"
            onPress={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  const backgroundColor =
    feedback === "correct"
      ? palette.green
      : feedback === "pass"
        ? "#C33D3D"
        : palette.blue;
  return (
    <SafeAreaView style={[styles.game, { backgroundColor }]}>
      <StatusBar style="light" />
      <View style={styles.width}>
        <View style={[ui.row, { justifyContent: "space-between" }]}>
          <Button
            label="Exit"
            tone="light"
            onPress={() => router.replace("/")}
          />
          <View
            style={[
              styles.clock,
              timeLeft <= 10 && { backgroundColor: palette.yellow },
            ]}
          >
            <Icon name="timer-outline" color={palette.ink} />
            <Text
              accessibilityLiveRegion={timeLeft <= 5 ? "polite" : "none"}
              style={styles.clockText}
            >
              {timeLeft}s
            </Text>
          </View>
          <Text style={styles.score}>{game.score} pts</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${game.progress}%` }]} />
        </View>
        <Pop trigger={`${game.index}-${feedback}`} style={styles.playCard}>
          <Text style={ui.eyebrow}>
            {feedback
              ? "NICE TEAMWORK"
              : `CARD ${Math.min(game.index + 1, game.totalCards)} / ${game.totalCards}`}
          </Text>
          <Text style={styles.term}>
            {feedback
              ? feedback === "correct"
                ? "Got it!"
                : "Next one!"
              : game.currentCard?.term}
          </Text>
          <Text style={[ui.body, { textAlign: "center" }]}>
            {feedback
              ? "Keep the clues coming."
              : "Clue crew: describe it without saying the word."}
          </Text>
        </Pop>
        <View style={ui.row}>
          <View style={{ flex: 1 }}>
            <Button
              label="Pass"
              icon="play-skip-forward"
              tone="coral"
              disabled={!!feedback}
              onPress={() => handleAction("pass")}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label="Got it!"
              icon="checkmark"
              tone="yellow"
              disabled={!!feedback}
              onPress={() => handleAction("correct")}
            />
          </View>
        </View>
        <Text style={styles.hint}>
          {sensor
            ? "Tilt back: got it / Tilt forward: pass / Return upright between cards"
            : "Tap the buttons to play on this device."}
        </Text>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.cream,
  },
  ready: {
    flex: 1,
    backgroundColor: palette.cream,
    padding: 24,
    justifyContent: "center",
  },
  game: { flex: 1, padding: 20 },
  width: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    flex: 1,
    justifyContent: "center",
  },
  clock: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  clockText: { color: palette.ink, fontSize: 25, fontWeight: "900" },
  score: { color: "#FFF", fontSize: 18, fontWeight: "800" },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF40",
    marginTop: 12,
  },
  fill: { height: 8, borderRadius: 4, backgroundColor: palette.yellow },
  playCard: {
    flex: 1,
    minHeight: 180,
    marginVertical: 24,
    backgroundColor: "#FFF",
    borderRadius: 30,
    borderWidth: 3,
    borderBottomWidth: 8,
    borderColor: palette.ink,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  term: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: "900",
    color: palette.ink,
    textAlign: "center",
  },
  hint: {
    color: "#FFF",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 8,
  },
});
