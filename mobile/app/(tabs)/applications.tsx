import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { apiFetch, type Application } from "../../lib/api";
import { colors, spacing, fontSize } from "../../lib/theme";
import { SafeAreaView } from "react-native-safe-area-context";

const statusColors: Record<string, { bg: string; text: string }> = {
  applied: { bg: "#FEF3C7", text: "#D97706" },
  pending: { bg: "#FEF3C7", text: "#D97706" },
  accepted: { bg: "#D1FAE5", text: "#059669" },
  rejected: { bg: "#FEE2E2", text: "#DC2626" },
};

export default function ApplicationsScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["applications"],
    queryFn: () => apiFetch<{ applications: Application[] }>("/applications"),
  });

  function renderApp({ item }: { item: Application }) {
    const sc = statusColors[item.status] || statusColors.pending;
    return (
      <TouchableOpacity style={styles.card} onPress={() => router.push(`/job/${item.jobs.id}`)} activeOpacity={0.7}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>{item.jobs.title}</Text>
            <Text style={styles.company}>{item.jobs.company}</Text>
            <Text style={styles.date}>Applied {new Date(item.applied_at).toLocaleDateString()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.text }]}>{item.status}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📄 My Applications</Text>
      </View>
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data?.applications || []}
          renderItem={renderApp}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 48 }}>📋</Text>
              <Text style={styles.emptyText}>No applications yet</Text>
              <Text style={styles.emptySubtext}>Start applying to remote jobs!</Text>
              <TouchableOpacity style={styles.ctaButton} onPress={() => router.push("/(tabs)")}>
                <Text style={styles.ctaText}>Browse Jobs</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md },
  headerTitle: { fontSize: fontSize["2xl"], fontWeight: "800", color: colors.text },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  title: { fontSize: fontSize.base, fontWeight: "700", color: colors.text },
  company: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  date: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 4 },
  statusBadge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 8 },
  statusText: { fontSize: fontSize.xs, fontWeight: "700", textTransform: "capitalize" },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyText: { fontSize: fontSize.lg, fontWeight: "600", color: colors.text, marginTop: spacing.md },
  emptySubtext: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 4 },
  ctaButton: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, marginTop: spacing.lg },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: fontSize.sm },
});
