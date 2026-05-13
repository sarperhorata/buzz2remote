import { useState } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { apiFetch, type Job } from "../../lib/api";
import { colors, spacing, fontSize } from "../../lib/theme";
import { SafeAreaView } from "react-native-safe-area-context";

const FILTERS = ["All", "Full-time", "Contract", "Freelance"];

export default function JobsScreen() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["jobs", search, activeFilter, page],
    queryFn: () => {
      const params: Record<string, string> = { page: page.toString(), limit: "20" };
      if (search) params.q = search;
      if (activeFilter !== "All") params.job_type = activeFilter;
      const query = new URLSearchParams(params).toString();
      return apiFetch<{ jobs: Job[]; total: number; totalPages: number }>(`/jobs?${query}`);
    },
  });

  function renderJob({ item }: { item: Job }) {
    const salary = item.salary_min && item.salary_max
      ? `$${Math.round(item.salary_min / 1000)}k - $${Math.round(item.salary_max / 1000)}k`
      : null;

    return (
      <TouchableOpacity style={styles.card} onPress={() => router.push(`/job/${item.id}`)} activeOpacity={0.7}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.company?.[0]?.toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.jobTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.company}>{item.company}</Text>
          </View>
        </View>
        <View style={styles.cardMeta}>
          {item.location && <Text style={styles.metaText}>📍 {item.location}</Text>}
          {item.posted_date && <Text style={styles.metaText}>🕐 {timeAgo(item.posted_date)}</Text>}
        </View>
        <View style={styles.tags}>
          {item.remote_type && <View style={styles.tagPrimary}><Text style={styles.tagPrimaryText}>{item.remote_type}</Text></View>}
          {item.job_type && <View style={styles.tag}><Text style={styles.tagText}>{item.job_type}</Text></View>}
          {salary && <Text style={styles.salary}>{salary}</Text>}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🐝 Remote Jobs</Text>
        <Text style={styles.headerSubtitle}>{data?.total ? `${data.total} jobs` : "Find your next role"}</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={(t) => { setSearch(t); setPage(1); }}
          placeholder="Search jobs, companies..."
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
        />
      </View>

      {/* Filter Pills */}
      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
            onPress={() => { setActiveFilter(f); setPage(1); }}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Job List */}
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data?.jobs || []}
          renderItem={renderJob}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No jobs found</Text>
              <Text style={styles.emptySubtext}>Try different search terms</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  headerTitle: { fontSize: fontSize["2xl"], fontWeight: "800", color: colors.text },
  headerSubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  searchContainer: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  searchInput: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: spacing.md, fontSize: fontSize.base, color: colors.text },
  filters: { flexDirection: "row", paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.sm },
  filterPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  filterPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: fontSize.xs, fontWeight: "600", color: colors.textSecondary },
  filterTextActive: { color: "#fff" },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.sm },
  avatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: fontSize.lg, fontWeight: "700" },
  jobTitle: { fontSize: fontSize.base, fontWeight: "700", color: colors.text },
  company: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  cardMeta: { flexDirection: "row", gap: spacing.lg, marginBottom: spacing.sm },
  metaText: { fontSize: fontSize.xs, color: colors.textMuted },
  tags: { flexDirection: "row", gap: spacing.sm, alignItems: "center", flexWrap: "wrap" },
  tagPrimary: { backgroundColor: `${colors.primary}20`, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 6 },
  tagPrimaryText: { fontSize: fontSize.xs, color: colors.primary, fontWeight: "600" },
  tag: { backgroundColor: `${colors.textMuted}15`, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: "500" },
  salary: { fontSize: fontSize.xs, fontWeight: "700", color: colors.success, marginLeft: "auto" },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyText: { fontSize: fontSize.lg, fontWeight: "600", color: colors.text },
  emptySubtext: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 4 },
});
