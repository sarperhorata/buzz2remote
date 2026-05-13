export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Engineering / Dev": [
    "engineer",
    "developer",
    "software",
    "backend",
    "frontend",
    "fullstack",
    "full-stack",
    "web dev",
    "mobile",
    "ios",
    "android",
    "devops",
    "sre",
    "platform",
    "infrastructure",
    "data engineer",
    "ml engineer",
  ],
  "Data / AI": [
    "data scientist",
    "data analyst",
    "machine learning",
    "ai",
    "analytics",
    "bi",
    "business intelligence",
    "nlp",
  ],
  "Product": [
    "product manager",
    "product owner",
    "pm",
    "cpo",
    "product lead",
  ],
  "Design": [
    "designer",
    "ux",
    "ui",
    "creative",
    "brand",
    "visual",
    "graphic",
  ],
  "Marketing": [
    "marketing",
    "growth",
    "seo",
    "content",
    "social media",
    "copywriter",
    "demand gen",
  ],
  "Sales / BD": [
    "sales",
    "account executive",
    "ae",
    "sdr",
    "bdr",
    "business development",
  ],
  "Operations": [
    "operations",
    "ops",
    "project manager",
    "scrum",
    "agile",
    "pmo",
  ],
  "Finance": [
    "finance",
    "accounting",
    "cfo",
    "controller",
    "analyst",
    "fp&a",
  ],
  "Support": [
    "support",
    "customer success",
    "csm",
    "helpdesk",
  ],
};

// More specific categories are checked first to avoid misclassification
// e.g. "data engineer" should be "Data / AI" not "Engineering / Dev"
const CATEGORY_ORDER = [
  "Data / AI",
  "Product",
  "Design",
  "Marketing",
  "Sales / BD",
  "Operations",
  "Finance",
  "Support",
  "Engineering / Dev",
];

export function classifyJobTitle(title: string): string {
  const lower = title.toLowerCase();

  for (const category of CATEGORY_ORDER) {
    const keywords = CATEGORY_KEYWORDS[category];
    if (keywords.some((kw) => lower.includes(kw))) {
      return category;
    }
  }

  return "Other";
}
