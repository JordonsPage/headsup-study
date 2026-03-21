import { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Card {
  term: string;
  definition: string;
}

export interface CardGameOptions {
  /** If true, shuffles cards before play. Default true. */
  shuffle?: boolean;
}

const SETTINGS_KEY = "headsup_settings";
const DEFAULT_SETTINGS = { timerDuration: 60, numberOfCards: 0 };

/**
 * Core card game engine shared by all game modes.
 * Handles: loading cards from route params, applying settings,
 * score/missed tracking, and end-of-game navigation.
 *
 * Usage:
 *   const game = useCardGame();
 *   game.answer("correct") | game.answer("pass")
 *   game.finish()  ← call to end early (e.g. timer ran out)
 */
export function useCardGame(options: CardGameOptions = {}) {
  const { shuffle = true } = options;
  const { cards: cardsParam } = useLocalSearchParams();
  const router = useRouter();

  const [cards, setCards] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<Card[]>([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  // Refs mirror state so accelerometers / timers can read current values
  // without stale closures.
  const cardsRef = useRef<Card[]>([]);
  const indexRef = useRef(0);
  const scoreRef = useRef(0);
  const missedRef = useRef<Card[]>([]);

  useEffect(() => {
    let rawCards: Card[] = [];
    try {
      rawCards = cardsParam ? JSON.parse(cardsParam as string) : [];
    } catch {
      rawCards = [];
    }
    if (!rawCards.length) {
      router.replace("/");
      return;
    }

    AsyncStorage.getItem(SETTINGS_KEY)
      .then((data) => {
        const s = data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
        let loaded = shuffle ? [...rawCards].sort(() => Math.random() - 0.5) : [...rawCards];
        if (s.numberOfCards > 0 && s.numberOfCards < loaded.length) {
          loaded = loaded.slice(0, s.numberOfCards);
        }
        cardsRef.current = loaded;
        setCards(loaded);
        setSettings(s);
        setReady(true);
      })
      .catch(() => {
        cardsRef.current = rawCards;
        setCards(rawCards);
        setReady(true);
      });
  }, []);

  /**
   * Record an answer for the current card.
   * Returns whether the game is now complete (no more cards).
   */
  function answer(action: "correct" | "pass"): boolean {
    const current = cardsRef.current[indexRef.current];
    if (!current) return true;

    const newScore = action === "correct" ? scoreRef.current + 1 : scoreRef.current;
    const newMissed =
      action === "pass" ? [...missedRef.current, current] : missedRef.current;

    scoreRef.current = newScore;
    missedRef.current = newMissed;
    setScore(newScore);
    setMissed(newMissed);

    const nextIndex = indexRef.current + 1;
    const done = nextIndex >= cardsRef.current.length;

    if (!done) {
      indexRef.current = nextIndex;
      setIndex(nextIndex);
    }

    return done;
  }

  /** Navigate to the results screen with current score/missed. */
  function finish(overrideScore?: number, overrideMissed?: Card[]) {
    router.replace({
      pathname: "/results" as any,
      params: {
        score: String(overrideScore ?? scoreRef.current),
        missed: JSON.stringify(overrideMissed ?? missedRef.current),
      },
    });
  }

  return {
    // State
    cards,
    index,
    score,
    missed,
    settings,
    ready,
    // Refs (for use inside timers / accelerometer callbacks)
    cardsRef,
    indexRef,
    scoreRef,
    missedRef,
    // Derived
    currentCard: cards[index] ?? null,
    progress: cards.length > 0 ? ((index + 1) / cards.length) * 100 : 0,
    totalCards: cards.length,
    // Actions
    answer,
    finish,
  };
}
