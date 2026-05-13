import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Linking, useWindowDimensions } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, type Job } from "../../lib/api";
import { colors, spacing, fontSize } from "../../lib/theme";

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", id],
    queryFn: () => apiFetch<Job>(`/jobs/${id}`),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>Job not found</Text>
      </View>
    );
  }

  const salary = job.salary_min && job.salary_max
    ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
    : job.salary;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{job.company?.[0]?.toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{job.title}</Text>
            <Text style={styles.company}>{job.company}</Text>
          </View>
        </View>

        {/* Tags */}
        <View style={styles.tags}>
          {job.location && <View style={styles.tag}><Text style={styles.tagText}>📍 {job.location}</Text></View>}
          {job.job_type && <View style={styles.tag}><Text style={styles.tagText}>💼 {job.job_type}</Text></View>}
          {job.remote_type && <View style={styles.tagPrimary}><Text style={styles.tagPrimaryText}>🌍 {job.remote_type}</Text></View>}
          {salary && <View style={styles.tagSuccess}><Text style={styles.tagSuccessText}>💰 {salary}</Text></View>}
        </View>

        {/* Skills */}
        {Array.isArray(job.skills) && job.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsRow}>
              {(job.skills as string[]).map((skill, i) => (
                <View key={i} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Description */}
        {job.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.bodyText}>{stripHtml(job.description)}</Text>
          </View>
        )}

        {/* Requirements */}
        {job.requirements && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requirements</Text>
            <Text style={styles.bodyText}>{stripHtml(job.requirements)}</Text>
          </View>
        )}

        {/* Benefits */}
        {job.benefits && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Benefits</Text>
            <Text style={styles.bodyText}>{stripHtml(job.benefits)}</Text>
          </View>
        )}
      </ScrollView>

      {/* Apply Button - Fixed Bottom */}
      {job.apply_url && (
        <View style={styles.applyContainer}>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => Linking.openURL(job.apply_url!)}
            activeOpacity={0.8}
          >
            <Text style={styles.applyText}>Apply Now ↗</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  errorText: { fontSize: fontSize.lg, color: colors.textSecondary },
  header: { flexDirection: "row", gap: spacing.lg, marginBottom: spacing.lg },
  avatar: { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: fontSize.xl, fontWeight: "700" },
  title: { fontSize: fontSize.xl, fontWeight: "800", color: colors.text },
  company: { fontSize: fontSize.base, color: colors.textSecondary, marginTop: 4 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.xl },
  tag: { backgroundColor: colors.card, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  tagText: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: "500" },
  tagPrimary: { backgroundColor: `${colors.primary}15`, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 10 },
  tagPrimaryText: { fontSize: fontSize.xs, color: colors.primary, fontWeight: "600" },
  tagSuccess: { backgroundColor: "#D1FAE5", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 10 },
  tagSuccessText: { fontSize: fontSize.xs, color: "#059669", fontWeight: "600" },
  section: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: fontSize.sm, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1, marginBottom: spacing.sm },
  bodyText: { fontSize: fontSize.base, color: colors.text, lineHeight: 24 },
  skillsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  skillTag: { backgroundColor: `${colors.primary}10`, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 8, borderWidth: 1, borderColor: `${colors.primary}30` },
  skillText: { fontSize: fontSize.xs, color: colors.primary, fontWeight: "600" },
  applyContainer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: spacing.lg, paddingBottom: spacing["3xl"], backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border },
  applyButton: { backgroundColor: colors.primary, borderRadius: 14, padding: spacing.lg, alignItems: "center", shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  applyText: { color: "#fff", fontSize: fontSize.lg, fontWeight: "800" },
});
