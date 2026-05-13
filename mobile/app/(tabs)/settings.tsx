import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../lib/auth";
import { colors, spacing, fontSize } from "../../lib/theme";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const { user, signOut } = useAuth();

  async function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}>
        <Text style={styles.headerTitle}>⚙️ Settings</Text>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <InfoRow label="Name" value={user?.name || "—"} />
            <InfoRow label="Email" value={user?.email || "—"} />
            <InfoRow label="Plan" value={user?.subscriptionPlan || "Free"} />
          </View>
        </View>

        {/* Subscription */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <View style={styles.card}>
            <Text style={styles.planLabel}>
              Current Plan: <Text style={styles.planValue}>{user?.subscriptionPlan || "Free"}</Text>
            </Text>
            <TouchableOpacity style={styles.upgradeButton}>
              <Text style={styles.upgradeText}>Upgrade Plan</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <InfoRow label="Version" value="1.0.0" />
            <InfoRow label="Build" value="Expo SDK 54" />
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerTitle: { fontSize: fontSize["2xl"], fontWeight: "800", color: colors.text, marginBottom: spacing.lg },
  section: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: fontSize.sm, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1, marginBottom: spacing.sm },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  infoLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  infoValue: { fontSize: fontSize.sm, fontWeight: "600", color: colors.text, textTransform: "capitalize" },
  planLabel: { fontSize: fontSize.base, color: colors.text, marginBottom: spacing.md },
  planValue: { fontWeight: "700", color: colors.primary, textTransform: "capitalize" },
  upgradeButton: { backgroundColor: `${colors.primary}15`, borderRadius: 12, padding: spacing.md, alignItems: "center" },
  upgradeText: { color: colors.primary, fontWeight: "700", fontSize: fontSize.sm },
  signOutButton: { backgroundColor: "#FEE2E2", borderRadius: 12, padding: spacing.lg, alignItems: "center", marginTop: spacing.lg },
  signOutText: { color: colors.error, fontWeight: "700", fontSize: fontSize.base },
});
