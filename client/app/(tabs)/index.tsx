import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const API_URL = "http://137.99.168.249:8000";

export default function HomeScreen() {
  const [text, setText] = useState("");
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleManual() {
    if (!text.trim()) {
      Alert.alert("Empty!", "Type some vocab terms first.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text }),
      });
      const data = await res.json();
      setCards(data.cards);
    } catch (e) {
      Alert.alert("Error", String(e));
    }
    setLoading(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Heads Up Study</Text>
      <TextInput
        style={styles.input}
        placeholder="Type vocab terms here..."
        multiline
        value={text}
        onChangeText={(val) => setText(val)}
      />
      <TouchableOpacity style={styles.button} onPress={handleManual}>
        <Text style={styles.buttonText}>
          {loading ? "Generating..." : "Generate Cards"}
        </Text>
      </TouchableOpacity>

      {cards.length > 0 && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#2ecc71", marginBottom: 12 }]}
          onPress={() => router.push({ pathname: "/game", params: { cards: JSON.stringify(cards) } })}
        >
          <Text style={styles.buttonText}>Start Game →</Text>
        </TouchableOpacity>
      )}

      {cards.map((card: any, i: number) => (
        <View key={i} style={styles.card}>
          <Text style={styles.term}>{card.term}</Text>
          <Text style={styles.definition}>{card.definition}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 60, backgroundColor: "#fff", flexGrow: 1 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 24, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 12, fontSize: 16, minHeight: 120, marginBottom: 8 },
  button: { backgroundColor: "#6C63FF", padding: 16, borderRadius: 10, alignItems: "center", marginBottom: 24 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  card: { backgroundColor: "#f0eeff", padding: 16, borderRadius: 10, marginBottom: 12 },
  term: { fontSize: 18, fontWeight: "bold", color: "#6C63FF" },
  definition: { fontSize: 14, color: "#444", marginTop: 4 },
});