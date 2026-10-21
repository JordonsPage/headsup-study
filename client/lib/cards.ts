export interface Card {
  term: string;
  definition: string;
}
export interface CardSet {
  id: string;
  name: string;
  cards: Card[];
  createdAt: number;
}
export const SETS_KEY = "card_sets";
export const SETTINGS_KEY = "headsup_settings";
export const DEFAULT_SETTINGS = { timerDuration: 60, numberOfCards: 0 };
export const TIMER_OPTIONS = [15, 30, 45, 60, 90, 120, 180, 300];
export const CARD_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 50];
export function readSettings(value: unknown) {
  const s = value as Partial<typeof DEFAULT_SETTINGS> | null;
  return {
    timerDuration: TIMER_OPTIONS.includes(s?.timerDuration as number)
      ? s!.timerDuration!
      : 60,
    numberOfCards: CARD_OPTIONS.includes(s?.numberOfCards as number)
      ? s!.numberOfCards!
      : 0,
  };
}
export function parseCards(value: unknown): Card[] {
  try {
    const data = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(data)) return [];
    return data.filter(
      (c): c is Card =>
        !!c &&
        typeof c.term === "string" &&
        typeof c.definition === "string" &&
        !!c.term.trim() &&
        !!c.definition.trim(),
    );
  } catch {
    return [];
  }
}
export function shuffleCards(cards: Card[], random = Math.random) {
  const result = [...cards];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export const SAMPLE_CARDS: Card[] = [
  {
    term: "Photosynthesis",
    definition: "The process plants use to turn sunlight into food.",
  },
  {
    term: "Gravity",
    definition: "The force that pulls objects toward each other.",
  },
  {
    term: "Metaphor",
    definition: "A comparison that describes one thing as another.",
  },
  {
    term: "Ecosystem",
    definition: "A community of living things and their environment.",
  },
  {
    term: "Democracy",
    definition:
      "A system of government in which people have a say through voting.",
  },
];
