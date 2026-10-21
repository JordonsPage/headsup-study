import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Button,
  Heading,
  Page,
  Panel,
  palette,
  ui,
} from "@/components/play-ui";
import {
  CARD_OPTIONS,
  DEFAULT_SETTINGS,
  readSettings,
  SETTINGS_KEY,
  TIMER_OPTIONS,
} from "@/lib/cards";
const formatTimer = (seconds: number) =>
  seconds < 60
    ? `${seconds}s`
    : `${Math.floor(seconds / 60)}m${seconds % 60 ? ` ${seconds % 60}s` : ""}`;
export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY)
      .then((raw) => setSettings(readSettings(raw ? JSON.parse(raw) : null)))
      .catch(() => setNotice("Using the default settings."))
      .finally(() => setReady(true));
  }, []);
  async function save() {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      setNotice("Saved! Your next round is ready.");
    } catch {
      setNotice("Could not save. Please try again.");
    }
  }
  return (
    <Page>
      <Button
        label="Back to the club"
        tone="light"
        icon="arrow-back"
        onPress={() => router.back()}
      />
      <Heading
        eyebrow="YOUR GAME, YOUR RULES"
        title="Set the pace."
        subtitle="Quick warm-up or a full class challenge? You choose."
      />
      {(
        [
          {
            key: "timerDuration",
            title: "Beat the clock",
            desc: "Time for each game round.",
            options: TIMER_OPTIONS,
            label: formatTimer,
          },
          {
            key: "numberOfCards",
            title: "Pick your deck size",
            desc: "Limit the cards in a timed round. Practice uses the whole deck.",
            options: CARD_OPTIONS,
            label: (n: number) => (n === 0 ? "All cards" : `${n} cards`),
          },
        ] as const
      ).map((group) => (
        <Panel key={group.key}>
          <Text style={ui.section}>{group.title}</Text>
          <Text style={[ui.body, { marginBottom: 18 }]}>{group.desc}</Text>
          <View style={[ui.row, { flexWrap: "wrap" }]}>
            {group.options.map((value) => (
              <Pressable
                key={value}
                disabled={!ready}
                accessibilityRole="button"
                accessibilityState={{
                  selected: settings[group.key] === value,
                  disabled: !ready,
                }}
                onPress={() =>
                  setSettings((s) => ({ ...s, [group.key]: value }))
                }
                style={[ui.chip, settings[group.key] === value && ui.selected]}
              >
                <Text style={ui.chipText}>{group.label(value)}</Text>
              </Pressable>
            ))}
          </View>
        </Panel>
      ))}
      <Panel color={palette.yellow}>
        <Text style={ui.section}>No rush? No problem.</Text>
        <Text style={ui.body}>
          Practice mode has no timer. Flip each card, check your answer, and
          revisit the ones you’re still learning.
        </Text>
      </Panel>
      <Button
        label="Save my settings"
        icon="checkmark"
        disabled={!ready}
        onPress={save}
      />
      {!!notice && (
        <Text accessibilityLiveRegion="polite" style={ui.body}>
          {notice}
        </Text>
      )}
    </Page>
  );
}
