import React from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Button,
  DeckArt,
  Heading,
  Page,
  Panel,
  Pop,
  palette,
  ui,
} from "@/components/play-ui";
import { parseCards } from "@/lib/cards";
export default function ResultsScreen() {
  const params = useLocalSearchParams<{
    score?: string;
    missed?: string;
    total?: string;
    remaining?: string;
  }>();
  const router = useRouter();
  const missed = parseCards(params.missed);
  const score = Math.max(0, Number(params.score) || 0);
  const total = Math.max(score + missed.length, Number(params.total) || 0);
  const remaining = Math.max(0, Number(params.remaining) || 0);
  const pct = total ? Math.round((score / total) * 100) : 0;
  return (
    <Page>
      <Pop>
        <DeckArt />
        <Heading
          eyebrow="THAT’S A WRAP"
          title={
            pct >= 70
              ? "You brought the brainpower."
              : "Good clues. Great effort."
          }
          subtitle="High-five your clue crew. Every round is progress."
        />
        <Panel color={palette.yellow}>
          <Text
            style={[
              ui.title,
              { fontSize: 64, lineHeight: 76, textAlign: "center" },
            ]}
          >
            {score}
          </Text>
          <Text style={[ui.eyebrow, { textAlign: "center" }]}>
            POINTS THIS ROUND
          </Text>
          <View
            style={[
              ui.row,
              { justifyContent: "space-around", marginVertical: 16 },
            ]}
          >
            <Text style={ui.chipText}>{score} got it</Text>
            <Text style={ui.chipText}>{missed.length} passed</Text>
            <Text style={ui.chipText}>{pct}% correct</Text>
          </View>
          <Text style={ui.body}>
            {total} cards attempted
            {remaining
              ? ` / ${remaining} left when time ran out`
              : " / Deck complete"}
            .
          </Text>
        </Panel>
      </Pop>
      {missed.length > 0 && (
        <>
          <Heading title="Give these another go." />
          {missed.map((card, i) => (
            <Panel key={i}>
              <Text style={ui.section}>{card.term}</Text>
              <Text style={ui.body}>{card.definition}</Text>
            </Panel>
          ))}
          <Button
            label="Practice passed cards"
            icon="layers-outline"
            tone="green"
            onPress={() =>
              router.replace({
                pathname: "/review",
                params: { cards: JSON.stringify(missed) },
              })
            }
          />
        </>
      )}
      <Button
        label="Back to my decks"
        icon="albums-outline"
        onPress={() => router.replace("/(tabs)/explore")}
      />
      <Button
        label="Make another deck"
        tone="light"
        icon="add"
        onPress={() => router.replace("/")}
      />
    </Page>
  );
}
