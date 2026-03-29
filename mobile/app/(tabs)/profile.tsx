import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, type Profile } from "../../lib/api";
import { colors, spacing, fontSize } from "../../lib/theme";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: () => apiFetch<{ profiles: Profile[] }>("/profiles"),
  });

  const profiles = data?.profiles || [];
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = profiles.find((p) => p.id === activeId) || profiles[0];

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (profiles.length > 0 && !activeId) setActiveId(profiles[0].id);
  }, [profiles]);

  useEffect(() => {
    if (active) {
      setName(active.profile_name || "");
      setTitle(active.title || "");
      setBio(active.bio || "");
    }
  }, [active?.id]);

  const saveMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/profiles/${active!.id}`, {
        method: "PUT",
        body: JSON.stringify({ profile_name: name, title, bio }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profiles"] }),
  });

  const createMutation = useMutation({
    mutationFn: (profileName: string) =>
      apiFetch<{ profile: Profile }>("/profiles", {
        method: "POST",
        body: JSON.stringify({ profile_name: profileName }),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      setActiveId(data.profile.id);
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}>
        <Text style={styles.headerTitle}>👤 Profiles</Text>

        {/* Profile Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
          {profiles.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.tab, p.id === active?.id && styles.tabActive]}
              onPress={() => setActiveId(p.id)}
            >
              <Text style={[styles.tabText, p.id === active?.id && styles.tabTextActive]}>
                {p.is_default ? "⭐ " : ""}{p.profile_name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.tabAdd}
            onPress={() => createMutation.mutate("New Profile")}
          >
            <Text style={styles.tabAddText}>+ New</Text>
          </TouchableOpacity>
        </ScrollView>

        {createMutation.isError && (
          <Text style={styles.error}>{(createMutation.error as Error).message}</Text>
        )}

        {active && (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Profile Name</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Frontend Developer" placeholderTextColor={colors.textMuted} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Target Position</Text>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Senior Software Engineer" placeholderTextColor={colors.textMuted} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Professional Summary</Text>
              <TextInput style={[styles.input, { height: 80, textAlignVertical: "top" }]} value={bio} onChangeText={setBio} placeholder="Brief summary..." placeholderTextColor={colors.textMuted} multiline />
            </View>

            {/* Skills */}
            {active.skills && active.skills.length > 0 && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Skills</Text>
                <View style={styles.skillsRow}>
                  {active.skills.map((s, i) => (
                    <View key={i} style={styles.skillTag}>
                      <Text style={styles.skillText}>{typeof s === "string" ? s : s.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.saveButton} onPress={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveText}>{saveMutation.isSuccess ? "✓ Saved!" : "Save Profile"}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerTitle: { fontSize: fontSize["2xl"], fontWeight: "800", color: colors.text, marginBottom: spacing.lg },
  tabs: { marginBottom: spacing.lg },
  tab: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, marginRight: spacing.sm },
  tabActive: { backgroundColor: `${colors.primary}15`, borderColor: colors.primary },
  tabText: { fontSize: fontSize.sm, fontWeight: "600", color: colors.textSecondary },
  tabTextActive: { color: colors.primary },
  tabAdd: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20, borderWidth: 1, borderColor: colors.border, borderStyle: "dashed" },
  tabAddText: { fontSize: fontSize.sm, fontWeight: "600", color: colors.textMuted },
  error: { backgroundColor: "#FEE2E2", color: colors.error, padding: spacing.md, borderRadius: 12, marginBottom: spacing.lg, fontSize: fontSize.sm },
  form: { backgroundColor: colors.card, borderRadius: 16, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  inputGroup: { marginBottom: spacing.lg },
  label: { fontSize: fontSize.sm, fontWeight: "600", color: colors.text, marginBottom: spacing.xs },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: spacing.md, fontSize: fontSize.base, color: colors.text },
  skillsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  skillTag: { backgroundColor: `${colors.primary}15`, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 8 },
  skillText: { fontSize: fontSize.xs, color: colors.primary, fontWeight: "600" },
  saveButton: { backgroundColor: colors.primary, borderRadius: 12, padding: spacing.lg, alignItems: "center", marginTop: spacing.sm },
  saveText: { color: "#fff", fontSize: fontSize.base, fontWeight: "700" },
});
