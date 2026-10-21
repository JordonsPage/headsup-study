import { Platform } from "react-native";
import { parseCards } from "./cards";
const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/$/, "");
export async function generateCards(body: string | FormData) {
  const response = await fetch(
    `${API_URL}/${typeof body === "string" ? "manual" : "upload"}`,
    {
      method: "POST",
      body,
      ...(typeof body === "string"
        ? { headers: { "Content-Type": "application/json" } }
        : {}),
    },
  );
  if (!response.ok)
    throw new Error(
      `Could not create cards (${response.status}). Please try again.`,
    );
  const data = await response.json();
  const cards = parseCards(data.cards);
  if (!cards.length)
    throw new Error("No terms found. Try adding more detail to your notes.");
  return cards;
}
export async function fileForm(uri: string, name: string, type: string) {
  const form = new FormData();
  if (Platform.OS === "web")
    form.append("file", await (await fetch(uri)).blob(), name);
  else form.append("file", { uri, name, type } as unknown as Blob);
  return form;
}
