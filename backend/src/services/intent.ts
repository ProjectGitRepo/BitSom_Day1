import type { Role } from "../types.js";

const STOPWORDS = new Set([
  "i", "need", "a", "an", "the", "for", "who", "can", "with", "someone", "some", "and", "or", "to", "of", "in", "on",
  "has", "have", "is", "are", "do", "does", "find", "looking", "person", "people", "employee", "employees"
]);

const PREFIX_LEN = 6;

// Crude but effective stand-in for stemming: comparing a fixed-length prefix absorbs most
// plural/tense variation in this domain's vocabulary ("gathering"/"gather", "managed"/"manage",
// "requirement"/"requirements") without pulling in a real NLP dependency.
function toKey(word: string): string {
  return word.slice(0, PREFIX_LEN);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function tokenKeys(text: string): Set<string> {
  return new Set(tokenize(text).map(toKey));
}

/**
 * Matches a free-text ask (e.g. "I need someone who can gather requirements and manage
 * stakeholders") against the role catalog by fuzzy token overlap — a lightweight,
 * deterministic stand-in for intent parsing. Returns the best-scoring role only if it
 * clears a minimum confidence bar, so a query with no real match falls back to a pure
 * ad-hoc evidence search instead of a forced, low-quality guess.
 */
export function detectRoleFromQuery(query: string, roles: Role[]): { role: Role; confidence: number } | null {
  const queryLower = query.toLowerCase();
  const queryKeys = tokenKeys(query);
  if (queryKeys.size === 0) return null;

  let best: { role: Role; score: number } | null = null;

  for (const role of roles) {
    let score = 0;

    for (const key of tokenKeys(role.title)) {
      if (queryKeys.has(key)) score += 3;
    }

    for (const phrase of role.evidenceKeywords) {
      if (queryLower.includes(phrase.toLowerCase())) {
        score += 2.5;
        continue;
      }
      const phraseKeys = [...tokenKeys(phrase)];
      const overlap = phraseKeys.filter((k) => queryKeys.has(k)).length;
      if (overlap > 0) score += overlap * (1 / Math.max(1, phraseKeys.length)) * 2;
    }

    for (const skill of role.requiredSkills) {
      if (queryLower.includes(skill.name.toLowerCase())) {
        score += 2;
        continue;
      }
      const skillKeys = [...tokenKeys(skill.name)];
      const overlap = skillKeys.filter((k) => queryKeys.has(k)).length;
      if (overlap > 0) score += overlap * (1 / Math.max(1, skillKeys.length)) * 1.5;
    }

    if (!best || score > best.score) best = { role, score };
  }

  if (!best || best.score < 1.8) return null;

  const confidence = Math.min(1, Math.round((best.score / 10) * 100) / 100);
  return { role: best.role, confidence };
}
