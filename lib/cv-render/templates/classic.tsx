/* eslint-disable jsx-a11y/alt-text */
/**
 * Classic template — single column, Times-style serif, ATS-friendly.
 *
 * ATS systems do best with:
 *   - Single column (no rail / no boxes)
 *   - Standard fonts (Times-Roman, Helvetica, Arial)
 *   - Clear section headings ("Experience", "Education", "Skills")
 *   - No images, no graphics, no special characters in section names
 *   - Text in reading order (LTR top-to-bottom)
 *
 * This template hits all of those. Best for finance, law, government,
 * consulting, and any role you're applying via Greenhouse / Workday / Taleo
 * where the parser feeds the CV through an OCR-ish pipeline.
 */

import { Document, Page, Text, View, StyleSheet, Link } from "@react-pdf/renderer";
import type { CVData } from "../types";

const C = {
  ink: "#0b0b0b",
  muted: "#3f3f3f",
  rule: "#1a1a1a",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Times-Roman",
    fontSize: 10.5,
    color: C.ink,
    paddingHorizontal: 56,
    paddingVertical: 48,
    lineHeight: 1.35,
  },
  name: {
    fontSize: 22,
    fontFamily: "Times-Bold",
    textAlign: "center",
    marginBottom: 2,
    letterSpacing: 1,
  },
  position: {
    fontSize: 11,
    color: C.muted,
    textAlign: "center",
    marginBottom: 4,
  },
  contactRow: {
    fontSize: 9.5,
    color: C.muted,
    textAlign: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Times-Bold",
    color: C.ink,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginTop: 14,
    marginBottom: 6,
    paddingBottom: 2,
    borderBottomWidth: 0.75,
    borderBottomColor: C.rule,
    borderBottomStyle: "solid",
  },
  paragraph: {
    fontSize: 10.5,
    color: C.ink,
    marginBottom: 6,
  },
  entry: {
    marginBottom: 10,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 1,
  },
  entryTitle: {
    fontSize: 11,
    fontFamily: "Times-Bold",
    flex: 1,
    paddingRight: 8,
  },
  entryDates: {
    fontSize: 10,
    color: C.muted,
    fontFamily: "Times-Italic",
  },
  entrySubtitle: {
    fontSize: 10.5,
    color: C.ink,
    fontFamily: "Times-Italic",
    marginBottom: 3,
  },
  entryDescription: {
    fontSize: 10.5,
    color: C.ink,
  },
  skillsText: {
    fontSize: 10.5,
    color: C.ink,
  },
  link: {
    color: C.muted,
    textDecoration: "none",
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

export function ClassicTemplate({ data }: { data: CVData }) {
  const contactBits: Array<{ text: string; href?: string }> = [];
  if (data.email) contactBits.push({ text: data.email, href: `mailto:${data.email}` });
  if (data.phone) contactBits.push({ text: data.phone });
  if (data.location) contactBits.push({ text: data.location });
  if (data.links?.linkedin) contactBits.push({ text: "LinkedIn", href: data.links.linkedin });
  if (data.links?.github) contactBits.push({ text: "GitHub", href: data.links.github });
  if (data.links?.portfolio) contactBits.push({ text: "Portfolio", href: data.links.portfolio });
  if (data.links?.website) contactBits.push({ text: "Website", href: data.links.website });

  return (
    <Document
      title={data.full_name ? `${data.full_name} – CV` : "CV"}
      author={data.full_name || "Buzz2Remote"}
      creator="Buzz2Remote CV Builder"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        {data.full_name && <Text style={styles.name}>{data.full_name}</Text>}
        {data.position && <Text style={styles.position}>{data.position}</Text>}
        {contactBits.length > 0 && (
          <Text style={styles.contactRow}>
            {contactBits.map((c, i) => (
              <Text key={i}>
                {i > 0 && " · "}
                {c.href ? <Link src={c.href} style={styles.link}>{c.text}</Link> : c.text}
              </Text>
            ))}
          </Text>
        )}

        {/* Summary */}
        {data.bio && (
          <>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.paragraph}>{data.bio}</Text>
          </>
        )}

        {/* Experience */}
        {data.work_experience && data.work_experience.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Professional Experience</Text>
            {data.work_experience.map((w, i) => (
              <View key={i} style={styles.entry} wrap={false}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>
                    {w.title}{w.company ? `, ${w.company}` : ""}
                  </Text>
                  <Text style={styles.entryDates}>{formatDateRange(w.start_date, w.end_date, w.is_current)}</Text>
                </View>
                {w.location && <Text style={styles.entrySubtitle}>{w.location}</Text>}
                {w.description && <Text style={styles.entryDescription}>{w.description}</Text>}
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
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>
                    {e.degree}{e.field ? `, ${e.field}` : ""}{e.school ? `, ${e.school}` : ""}
                  </Text>
                  <Text style={styles.entryDates}>{formatDateRange(e.start_date, e.end_date)}</Text>
                </View>
                {e.description && <Text style={styles.entryDescription}>{e.description}</Text>}
              </View>
            ))}
          </>
        )}

        {/* Skills */}
        {data.skills && data.skills.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Skills</Text>
            <Text style={styles.skillsText}>{data.skills.join(" · ")}</Text>
          </>
        )}

        {/* Languages */}
        {data.languages && data.languages.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Languages</Text>
            <Text style={styles.skillsText}>
              {data.languages.map((l) => `${l.name}${l.proficiency ? ` (${l.proficiency})` : ""}`).join(" · ")}
            </Text>
          </>
        )}

        {/* Certificates */}
        {data.certificates && data.certificates.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {data.certificates.map((c, i) => (
              <Text key={i} style={styles.entryDescription}>• {c}</Text>
            ))}
          </>
        )}
      </Page>
    </Document>
  );
}
