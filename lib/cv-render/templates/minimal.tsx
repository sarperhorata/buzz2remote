/* eslint-disable jsx-a11y/alt-text */
/**
 * Minimal template — generous whitespace, no chrome, no colour.
 *
 * Aimed at senior / executive roles where the candidate's name and a
 * tightly-written summary do most of the selling. The visual style says:
 * "my work speaks for itself, I don't need a designer CV." Helvetica only,
 * grayscale.
 *
 * Specifically: ranks the BIO before everything else (it's the lead), uses
 * a narrower content column for easier scanning, and lets dates ride on the
 * right margin without aggressive alignment markers.
 */

import { Document, Page, Text, View, StyleSheet, Link } from "@react-pdf/renderer";
import type { CVData } from "../types";

const C = {
  ink: "#1f2937",     // slate-800
  muted: "#6b7280",   // slate-500
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.ink,
    paddingHorizontal: 64,
    paddingVertical: 56,
    lineHeight: 1.45,
  },
  name: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    marginBottom: 1,
    letterSpacing: -0.5,
  },
  position: {
    fontSize: 11,
    color: C.muted,
    marginBottom: 18,
  },
  contactRow: {
    fontSize: 9.5,
    color: C.muted,
    marginBottom: 22,
  },
  link: {
    color: C.muted,
    textDecoration: "none",
  },
  bio: {
    fontSize: 10.5,
    color: C.ink,
    marginBottom: 26,
    lineHeight: 1.5,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginTop: 4,
    marginBottom: 12,
  },
  entry: {
    flexDirection: "row",
    marginBottom: 14,
  },
  entryDates: {
    width: 80,
    fontSize: 9,
    color: C.muted,
    paddingTop: 1,
  },
  entryBody: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    marginBottom: 1,
  },
  entrySubtitle: {
    fontSize: 10,
    color: C.muted,
    marginBottom: 3,
  },
  entryDescription: {
    fontSize: 9.5,
    color: C.ink,
    lineHeight: 1.45,
  },
  inlineList: {
    fontSize: 10,
    color: C.ink,
    marginBottom: 4,
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

export function MinimalTemplate({ data }: { data: CVData }) {
  const contactBits: Array<{ text: string; href?: string }> = [];
  if (data.email) contactBits.push({ text: data.email, href: `mailto:${data.email}` });
  if (data.phone) contactBits.push({ text: data.phone });
  if (data.location) contactBits.push({ text: data.location });
  if (data.links?.linkedin) contactBits.push({ text: "LinkedIn", href: data.links.linkedin });
  if (data.links?.github) contactBits.push({ text: "GitHub", href: data.links.github });
  if (data.links?.portfolio) contactBits.push({ text: "Portfolio", href: data.links.portfolio });

  return (
    <Document
      title={data.full_name ? `${data.full_name} – CV` : "CV"}
      author={data.full_name || "Buzz2Remote"}
      creator="Buzz2Remote CV Builder"
    >
      <Page size="A4" style={styles.page}>
        {data.full_name && <Text style={styles.name}>{data.full_name}</Text>}
        {data.position && <Text style={styles.position}>{data.position}</Text>}

        {contactBits.length > 0 && (
          <Text style={styles.contactRow}>
            {contactBits.map((c, i) => (
              <Text key={i}>
                {i > 0 && "  ·  "}
                {c.href ? <Link src={c.href} style={styles.link}>{c.text}</Link> : c.text}
              </Text>
            ))}
          </Text>
        )}

        {data.bio && <Text style={styles.bio}>{data.bio}</Text>}

        {/* Experience */}
        {data.work_experience && data.work_experience.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Experience</Text>
            {data.work_experience.map((w, i) => (
              <View key={i} style={styles.entry} wrap={false}>
                <Text style={styles.entryDates}>{formatDateRange(w.start_date, w.end_date, w.is_current)}</Text>
                <View style={styles.entryBody}>
                  <Text style={styles.entryTitle}>{w.title || "—"}</Text>
                  {(w.company || w.location) && (
                    <Text style={styles.entrySubtitle}>
                      {w.company}{w.company && w.location ? " · " : ""}{w.location}
                    </Text>
                  )}
                  {w.description && <Text style={styles.entryDescription}>{w.description}</Text>}
                </View>
              </View>
            ))}
          </>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Education</Text>
            {data.education.map((e, i) => (
              <View key={i} style={styles.entry} wrap={false}>
                <Text style={styles.entryDates}>{formatDateRange(e.start_date, e.end_date)}</Text>
                <View style={styles.entryBody}>
                  <Text style={styles.entryTitle}>
                    {e.degree}{e.field ? `, ${e.field}` : ""}
                  </Text>
                  {e.school && <Text style={styles.entrySubtitle}>{e.school}</Text>}
                  {e.description && <Text style={styles.entryDescription}>{e.description}</Text>}
                </View>
              </View>
            ))}
          </>
        )}

        {/* Skills */}
        {data.skills && data.skills.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Skills</Text>
            <Text style={styles.inlineList}>{data.skills.join(", ")}</Text>
          </>
        )}

        {/* Languages */}
        {data.languages && data.languages.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Languages</Text>
            <Text style={styles.inlineList}>
              {data.languages.map((l) => `${l.name}${l.proficiency ? ` (${l.proficiency})` : ""}`).join(", ")}
            </Text>
          </>
        )}

        {/* Certificates */}
        {data.certificates && data.certificates.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {data.certificates.map((c, i) => (
              <Text key={i} style={styles.inlineList}>{c}</Text>
            ))}
          </>
        )}
      </Page>
    </Document>
  );
}
