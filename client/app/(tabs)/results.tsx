import * as React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function ResultsScreen() {
  const { score, missed } = useLocalSearchParams();
  const router = useRouter();
  const missedTerms = JSON.parse(missed as string);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Round Over!</Text>
      <Text style={styles.score}>Score: {score}</Text>

      {missedTerms.length > 0 && (
        <>
          <Text style={styles.missedTitle}>Missed Terms:</Text>
          {missedTerms.map((term: string, i: number) => (
            <View key={i} style={styles.missedCard}>
              <Text style={styles.missedTerm}>{term}</Text>
            </View>
          ))}
        </>
      )}

      <TouchableOpacity style={styles.button} onPress={() => router.replace("/")}>
        <Text style={styles.buttonText}>Play Again</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 80, backgroundColor: "#fff", flexGrow: 1, alignItems: "center" },
  title: { fontSize: 36, fontWeight: "bold", marginBottom: 16, color: "#6C63FF" },
  score: { fontSize: 28, marginBottom: 32, color: "#333" },
  missedTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "#e74c3c" },
  missedCard: { backgroundColor: "#ffeaea", padding: 12, borderRadius: 8, marginBottom: 8, width: "100%" },
  missedTerm: { fontSize: 16, color: "#c0392b" },
  button: { backgroundColor: "#6C63FF", padding: 16, borderRadius: 12, marginTop: 32, width: "100%", alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
