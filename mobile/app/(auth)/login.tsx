import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import { Link, router } from "expo-router";
import { login } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { colors, spacing, fontSize } from "../../lib/theme";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) return;
    setError("");
    setLoading(true);
    try {
      const data = await login(email.trim().toLowerCase(), password);
      setUser(data.user);
      router.replace("/(tabs)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🐝</Text>
            <Text style={styles.logoText}>Buzz2Remote</Text>
          </View>

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.buttonText}>Sign In</Text>}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: "center", padding: spacing["2xl"] },
  logoContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: spacing["3xl"] },
  logoEmoji: { fontSize: 36, marginRight: spacing.sm },
  logoText: { fontSize: fontSize["2xl"], fontWeight: "800", color: colors.primary },
  title: { fontSize: fontSize["2xl"], fontWeight: "700", color: colors.text, textAlign: "center" },
  subtitle: { fontSize: fontSize.base, color: colors.textSecondary, textAlign: "center", marginTop: spacing.xs, marginBottom: spacing["2xl"] },
  error: { backgroundColor: "#FEE2E2", color: colors.error, padding: spacing.md, borderRadius: 12, marginBottom: spacing.lg, fontSize: fontSize.sm, overflow: "hidden" },
  inputGroup: { marginBottom: spacing.lg },
  label: { fontSize: fontSize.sm, fontWeight: "600", color: colors.text, marginBottom: spacing.xs },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: spacing.lg, fontSize: fontSize.base, color: colors.text },
  button: { backgroundColor: colors.primary, borderRadius: 12, padding: spacing.lg, alignItems: "center", marginTop: spacing.sm, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  buttonText: { color: "#fff", fontSize: fontSize.base, fontWeight: "700" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing["2xl"] },
  footerText: { color: colors.textSecondary, fontSize: fontSize.sm },
  footerLink: { color: colors.primary, fontSize: fontSize.sm, fontWeight: "600" },
});
