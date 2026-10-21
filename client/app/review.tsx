import React, { useEffect, useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Button,
  Heading,
  Page,
  Panel,
  Pop,
  palette,
  ui,
} from "@/components/play-ui";
import { parseCards } from "@/lib/cards";
export default function ReviewScreen() {
  const { cards: param } = useLocalSearchParams<{ cards?: string }>();
  const router = useRouter();
  const cards = useMemo(() => parseCards(param), [param]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [missed, setMissed] = useState<number[]>([]);
  const [known, setKnown] = useState(0);
  const locked = useRef(false);
  useEffect(() => {
    setIndex(0);
    setFlipped(false);
    setMissed([]);
    setKnown(0);
    locked.current = false;
    if (!cards.length) router.replace("/");
  }, [cards, router]);
  useEffect(() => {
    locked.current = false;
  }, [index]);
  if (!cards.length) return null;
  const done = index >= cards.length;
  function answer(correct: boolean) {
    if (locked.current || !flipped || done) return;
    locked.current = true;
    if (correct) setKnown((n) => n + 1);
    else setMissed((m) => [...m, index]);
    setFlipped(false);
    setIndex((n) => n + 1);
  }
  return (
    <Page>
      <Button
        label="Back to the club"
        tone="light"
        icon="arrow-back"
        onPress={() => router.replace("/")}
      />
      <Heading
        eyebrow={done ? "LOOK AT YOU GO" : "NO CLOCK. JUST CURIOSITY."}
        title={done ? "Practice makes progress." : "Take a little brain break."}
        subtitle={
          done
            ? `${known} known / ${missed.length} still learning`
            : `Card ${index + 1} of ${cards.length}`
        }
      />
      {done ? (
        <Pop>
          <Panel color={palette.yellow}>
            <Text style={ui.section}>One step smarter.</Text>
            <Text style={[ui.body, { marginBottom: 20 }]}>
              Every round counts. Revisit the tricky ones or give the whole deck
              another go.
            </Text>
            {missed.length > 0 && (
              <Button
                label="Practice tricky cards"
                icon="layers-outline"
                onPress={() =>
                  router.replace({
                    pathname: "/review",
                    params: {
                      cards: JSON.stringify(missed.map((i) => cards[i])),
                    },
                  })
                }
              />
            )}
            <Button
              label="Go again"
              icon="refresh"
              tone="light"
              onPress={() => {
                setIndex(0);
                setKnown(0);
                setMissed([]);
                setFlipped(false);
                locked.current = false;
              }}
            />
          </Panel>
          {missed.map((i) => (
            <Panel key={i}>
              <Text style={ui.section}>{cards[i].term}</Text>
              <Text style={ui.body}>{cards[i].definition}</Text>
            </Panel>
          ))}
        </Pop>
      ) : (
        <>
          <Pop trigger={`${index}-${flipped}`}>
            <Panel color={flipped ? palette.lilac : "#FFF"}>
              <View
                style={{
                  minHeight: 240,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={ui.eyebrow}>
                  {flipped ? "THE ANSWER" : "WHAT DOES IT MEAN?"}
                </Text>
                <Text
                  style={[
                    ui.title,
                    { fontSize: flipped ? 25 : 34, textAlign: "center" },
                  ]}
                >
                  {flipped ? cards[index].definition : cards[index].term}
                </Text>
              </View>
            </Panel>
          </Pop>
          {flipped ? (
            <>
              <Button
                label="Got it!"
                tone="green"
                icon="checkmark"
                onPress={() => answer(true)}
              />
              <Button
                label="Still learning"
                tone="yellow"
                icon="refresh-outline"
                onPress={() => answer(false)}
              />
            </>
          ) : (
            <Button
              label="Reveal the answer"
              icon="layers-outline"
              onPress={() => setFlipped(true)}
            />
          )}
          <Text style={ui.body}>
            {known} known / {missed.length} still learning
          </Text>
        </>
      )}
    </Page>
  );
}
