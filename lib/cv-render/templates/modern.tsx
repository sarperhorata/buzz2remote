/* eslint-disable jsx-a11y/alt-text */
/**
 * Modern template — clean two-column layout with an amber accent stripe.
 * Best for tech and design roles. Designed for one-page CVs but @react-pdf
 * will auto-paginate to a second page when needed.
 *
 * Layout:
 *   - Left rail (35%): name, contact, links, skills, languages
 *   - Right rail (65%): summary, experience, education, certificates
 *
 * No external fonts — we stick to the @react-pdf built-ins (Helvetica) to
 * keep the bundle small and avoid font-loading flakiness in serverless cold
 * starts. If we add a font later, register it once at module level and
 * cache the result.
 */

import { Document, Page, Text, View, StyleSheet, Link } from "@react-pdf/renderer";
import type { CVData } from "../types";

const C = {
  ink: "#0f172a",       // body text (slate-900)
  muted: "#475569",     // secondary text (slate-600)
  rail: "#f8fafc",      // left-rail background (slate-50)
  border: "#e2e8f0",    // section divider (slate-200)
  accent: "#f59e0b",    // amber-500 — section dot + header underline
  accentDark: "#b45309", // amber-700 — used for link colour (better print contrast than amber-500)
};

const styles = StyleSheet.create({
  page: {
    flexDirection: "row",
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: C.ink,
  },
  rail: {
    width: "33%",
    backgroundColor: C.rail,
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  main: {
    width: "67%",
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  // Header
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: C.ink,
    marginBottom: 2,
  },
  position: {
    fontSize: 11,
    color: C.accentDark,
    marginBottom: 14,
  },
  contactRow: {
    fontSize: 9,
    color: C.muted,
    marginBottom: 3,
  },
  link: {
    color: C.accentDark,
    textDecoration: "none",
  },
  // Sections
  railSectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: C.ink,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginTop: 16,
    marginBottom: 6,
  },
  mainSectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: C.ink,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1.5,
    borderBottomColor: C.accent,
    borderBottomStyle: "solid",
  },
  // Body
  paragraph: {
    fontSize: 9.5,
    color: C.ink,
    lineHeight: 1.4,
    marginBottom: 10,
  },
  skill: {
    fontSize: 9,
    color: C.ink,
    marginBottom: 2,
  },
  // Work / Education entries
  entry: {
    marginBottom: 12,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 1,
  },
  entryTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: C.ink,
    flex: 1,
    paddingRight: 8,
  },
  entryDates: {
    fontSize: 8.5,
    color: C.muted,
  },
  entrySubtitle: {
    fontSize: 9.5,
    color: C.accentDark,
    marginBottom: 4,
  },
  entryDescription: {
    fontSize: 9,
    color: C.ink,
    lineHeight: 1.45,
  },
  // Bullet for skills / languages
  bullet: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  bulletDot: {
    width: 3,
    height: 3,
    backgroundColor: C.accent,
    borderRadius: 1.5,
    marginTop: 5,
    marginRight: 6,
  },
});

function formatDateRange(start?: string, end?: string, isCurrent?: boolean): string {
  if (!start && !end && !isCurrent) return "";
  const s = start ?? "";
  const e = isCurrent ? "Present" : (end ?? "");
  if (!s && !e) return "";
  if (!e) return s;
  return `${s} – ${e}`;
}

export function ModernTemplate({ data }: { data: CVData }) {
  const contactBits = [data.email, data.phone, data.location].filter(Boolean);
  const linkEntries: Array<[string, string]> = data.links
    ? (Object.entries(data.links) as Array<[string, string]>).filter(([, v]) => Boolean(v))
    : [];

  return (
    <Document
      title={data.full_name ? `${data.full_name} – CV` : "CV"}
      author={data.full_name || "Buzz2Remote"}
      creator="Buzz2Remote CV Builder"
    >
      <Page size="A4" style={styles.page}>
        {/* Left rail */}
        <View style={styles.rail}>
          {/* Contact */}
          <Text style={styles.railSectionTitle}>Contact</Text>
          {contactBits.map((bit, i) => (
            <Text key={i} style={styles.contactRow}>{bit}</Text>
          ))}
          {linkEntries.map(([key, url]) => (
            <Link key={key} src={url} style={{ ...styles.contactRow, ...styles.link }}>
              {key}
            </Link>
          ))}

          {/* Skills */}
          {data.skills && data.skills.length > 0 && (
            <>
              <Text style={styles.railSectionTitle}>Skills</Text>
              {data.skills.map((s, i) => (
                <View key={i} style={styles.bullet}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.skill}>{s}</Text>
                </View>
              ))}
            </>
          )}

          {/* Languages */}
          {data.languages && data.languages.length > 0 && (
            <>
              <Text style={styles.railSectionTitle}>Languages</Text>
              {data.languages.map((l, i) => (
                <Text key={i} style={styles.contactRow}>
                  {l.name}{l.proficiency ? ` — ${l.proficiency}` : ""}
                </Text>
              ))}
            </>
          )}

          {/* Certificates */}
          {data.certificates && data.certificates.length > 0 && (
            <>
              <Text style={styles.railSectionTitle}>Certificates</Text>
              {data.certificates.map((c, i) => (
                <Text key={i} style={styles.contactRow}>{c}</Text>
              ))}
            </>
          )}
        </View>

        {/* Right rail */}
        <View style={styles.main}>
          {data.full_name && <Text style={styles.name}>{data.full_name}</Text>}
          {data.position && <Text style={styles.position}>{data.position}</Text>}

          {/* Summary */}
          {data.bio && (
            <>
              <Text style={styles.mainSectionTitle}>Profile</Text>
              <Text style={styles.paragraph}>{data.bio}</Text>
            </>
          )}

          {/* Experience */}
          {data.work_experience && data.work_experience.length > 0 && (
            <>
              <Text style={styles.mainSectionTitle}>Experience</Text>
              {data.work_experience.map((w, i) => (
                <View key={i} style={styles.entry} wrap={false}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryTitle}>{w.title || "—"}</Text>
                    <Text style={styles.entryDates}>{formatDateRange(w.start_date, w.end_date, w.is_current)}</Text>
                  </View>
                  {(w.company || w.location) && (
                    <Text style={styles.entrySubtitle}>
                      {w.company}{w.company && w.location ? " · " : ""}{w.location}
                    </Text>
                  )}
                  {w.description && <Text style={styles.entryDescription}>{w.description}</Text>}
                </View>
              ))}
            </>
          )}

          {/* Education */}
          {data.education && data.education.length > 0 && (
            <>
              <Text style={styles.mainSectionTitle}>Education</Text>
              {data.education.map((e, i) => (
                <View key={i} style={styles.entry} wrap={false}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryTitle}>
                      {e.degree}{e.field ? `, ${e.field}` : ""}
                    </Text>
                    <Text style={styles.entryDates}>{formatDateRange(e.start_date, e.end_date)}</Text>
                  </View>
                  {e.school && <Text style={styles.entrySubtitle}>{e.school}</Text>}
                  {e.description && <Text style={styles.entryDescription}>{e.description}</Text>}
                </View>
              ))}
            </>
          )}
        </View>
      </Page>
    </Document>
  );
}
