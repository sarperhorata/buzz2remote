"use client";

/**
 * Client island for the skills list on the job detail page.
 *
 * Why client: the parent page is a server component (for SEO) but the
 * "Show N more" toggle needs local state. Everything else stays server-side.
 *
 * Each skill renders as a Link to /jobs?q=<skill> so users can pivot
 * sideways into a search.
 */

import { useState } from "react";
import Link from "next/link";

const VISIBLE_LIMIT = 12;

interface Props {
  skills: string[];
}

export function SkillsTagList({ skills }: Props) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? skills : skills.slice(0, VISIBLE_LIMIT);
  const hiddenCount = skills.length - VISIBLE_LIMIT;
  const showToggle = skills.length > VISIBLE_LIMIT;

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((skill) => (
        <Link
          key={skill}
          href={`/jobs?q=${encodeURIComponent(skill)}`}
          title={`Search remote ${skill} jobs`}
          className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-amber-100 hover:text-amber-800 dark:hover:bg-amber-900/40 dark:hover:text-amber-200 px-3 py-1 rounded-full text-sm transition-colors cursor-pointer"
        >
          {skill}
        </Link>
      ))}
      {showToggle && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="border border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-1 rounded-full text-sm transition-colors cursor-pointer"
        >
          {expanded ? "Show less" : `+${hiddenCount} more`}
        </button>
      )}
    </div>
  );
}
