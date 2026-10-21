import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  type Card,
  DEFAULT_SETTINGS,
  parseCards,
  readSettings,
  SETTINGS_KEY,
  shuffleCards,
} from "@/lib/cards";
export type { Card } from "@/lib/cards";
export function useCardGame() {
  const { cards: param } = useLocalSearchParams<{ cards?: string }>();
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const state = useRef({
    cards: [] as Card[],
    index: 0,
    score: 0,
    missed: [] as Card[],
    finished: false,
  });
  useEffect(() => {
    let active = true;
    const raw = parseCards(param);
    if (!raw.length) {
      router.replace("/");
      return;
    }
    async function load() {
      let loadedSettings = DEFAULT_SETTINGS;
      try {
        const value = await AsyncStorage.getItem(SETTINGS_KEY);
        loadedSettings = readSettings(value ? JSON.parse(value) : null);
      } catch {
        /* Use defaults if local settings are unavailable. */
      }
      if (!active) return;
      let deck = shuffleCards(raw);
      if (loadedSettings.numberOfCards)
        deck = deck.slice(0, loadedSettings.numberOfCards);
      state.current = {
        cards: deck,
        index: 0,
        score: 0,
        missed: [],
        finished: false,
      };
      setCards(deck);
      setIndex(0);
      setScore(0);
      setSettings(loadedSettings);
      setReady(true);
    }
    setReady(false);
    void load();
    return () => {
      active = false;
    };
  }, [param, router]);
  const answer = useCallback((action: "correct" | "pass") => {
    const s = state.current;
    const card = s.cards[s.index];
    if (s.finished || !card) return true;
    if (action === "correct") s.score++;
    else s.missed.push(card);
    s.index++;
    setScore(s.score);
    setIndex(s.index);
    return s.index >= s.cards.length;
  }, []);
  const finish = useCallback(() => {
    const s = state.current;
    if (s.finished) return;
    s.finished = true;
    router.replace({
      pathname: "/results",
      params: {
        score: String(s.score),
        missed: JSON.stringify(s.missed),
        total: String(s.index),
        remaining: String(s.cards.length - s.index),
      },
    });
  }, [router]);
  return {
    cards,
    index,
    score,
    settings,
    ready,
    answer,
    finish,
    currentCard: cards[Math.min(index, cards.length - 1)],
    totalCards: cards.length,
    progress: cards.length ? (index / cards.length) * 100 : 0,
  };
}
