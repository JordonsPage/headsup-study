import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export const palette = {
  ink: "#172C52",
  blue: "#1459D9",
  yellow: "#FFD84D",
  coral: "#F86558",
  green: "#137C61",
  cream: "#FFF9EB",
  muted: "#536580",
  line: "#D7E0F0",
  lilac: "#EEE8FF",
};
export type IconName = React.ComponentProps<typeof Ionicons>["name"];
export function Icon({
  name,
  color = palette.ink,
  size = 24,
}: {
  name: IconName;
  color?: string;
  size?: number;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}
export function Pop({
  children,
  trigger = 0,
  style,
}: {
  children: React.ReactNode;
  trigger?: string | number;
  style?: StyleProp<ViewStyle>;
}) {
  const value = useRef(new Animated.Value(1)).current;
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (reduced) {
      value.setValue(1);
      return;
    }
    value.setValue(0);
    const animation = Animated.spring(value, {
      toValue: 1,
      friction: 7,
      tension: 65,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [trigger, reduced, value]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: value,
          transform: [
            {
              translateY: value.interpolate({
                inputRange: [0, 1],
                outputRange: [18, 0],
              }),
            },
            {
              scale: value.interpolate({
                inputRange: [0, 1],
                outputRange: [0.96, 1],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
export function Button({
  label,
  icon,
  onPress,
  tone = "blue",
  disabled = false,
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  tone?: "blue" | "yellow" | "green" | "coral" | "light";
  disabled?: boolean;
}) {
  const light = tone === "yellow" || tone === "light";
  const color = light ? palette.ink : "#FFF";
  const backgroundColor = tone === "light" ? "#FFF" : palette[tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        ui.button,
        {
          backgroundColor,
          opacity: disabled ? 0.5 : 1,
          transform: [{ translateY: pressed ? 3 : 0 }],
          borderBottomWidth: pressed ? 1 : 4,
        },
      ]}
    >
      {icon && <Icon name={icon} color={color} size={21} />}
      <Text style={[ui.buttonText, { color }]}>{label}</Text>
    </Pressable>
  );
}
export function Page({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={ui.safe} edges={["top", "left", "right"]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={ui.page}
      >
        <View style={ui.width}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}
export function Heading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={{ marginBottom: 24 }}>
      {eyebrow && <Text style={ui.eyebrow}>{eyebrow}</Text>}
      <Text style={ui.title}>{title}</Text>
      {subtitle && <Text style={ui.body}>{subtitle}</Text>}
    </View>
  );
}
export function Panel({
  children,
  color = "#FFF",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return <View style={[ui.panel, { backgroundColor: color }]}>{children}</View>;
}
export function DeckArt() {
  return (
    <View
      style={ui.art}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View
        style={[
          ui.artCard,
          {
            backgroundColor: palette.coral,
            transform: [{ rotate: "-14deg" }],
            left: 18,
            top: 15,
          },
        ]}
      />
      <View
        style={[
          ui.artCard,
          {
            backgroundColor: palette.yellow,
            transform: [{ rotate: "9deg" }],
            left: 44,
            top: 8,
          },
        ]}
      />
      <View
        style={[ui.artCard, { backgroundColor: "#FFF", left: 32, top: 24 }]}
      >
        <Icon name="flash" size={42} color={palette.blue} />
        <View style={ui.artLine} />
        <View style={[ui.artLine, { width: 26 }]} />
      </View>
      <View style={ui.spark}>
        <Icon name="star" color={palette.yellow} size={28} />
      </View>
    </View>
  );
}
export const ui = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.cream },
  page: { flexGrow: 1, padding: 22, paddingBottom: 40 },
  width: { width: "100%", maxWidth: 760, alignSelf: "center" },
  title: {
    fontSize: 34,
    lineHeight: 39,
    fontWeight: "900",
    color: palette.ink,
    letterSpacing: -1,
  },
  eyebrow: {
    color: palette.blue,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 9,
  },
  body: { color: palette.muted, fontSize: 15, lineHeight: 23, marginTop: 9 },
  panel: {
    borderRadius: 24,
    padding: 22,
    borderWidth: 2,
    borderColor: palette.ink,
    borderBottomWidth: 5,
    marginBottom: 20,
  },
  section: {
    fontSize: 21,
    color: palette.ink,
    fontWeight: "800",
    marginBottom: 14,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  button: {
    minHeight: 54,
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: palette.ink,
    marginBottom: 10,
  },
  buttonText: {
    fontWeight: "800",
    fontSize: 16,
    textAlign: "center",
    flexShrink: 1,
  },
  input: {
    borderWidth: 2,
    borderColor: palette.line,
    borderRadius: 16,
    padding: 15,
    fontSize: 16,
    color: palette.ink,
    backgroundColor: "#F5F8FF",
    marginBottom: 14,
  },
  chip: {
    minHeight: 46,
    borderWidth: 2,
    borderColor: palette.line,
    borderRadius: 13,
    paddingHorizontal: 16,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  selected: { backgroundColor: palette.yellow, borderColor: palette.ink },
  chipText: { color: palette.ink, fontWeight: "800" },
  art: { width: 156, height: 158, alignSelf: "center" },
  artCard: {
    position: "absolute",
    width: 86,
    height: 112,
    borderWidth: 3,
    borderColor: palette.ink,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  artLine: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.line,
  },
  spark: { position: "absolute", right: 0, top: 0 },
});
