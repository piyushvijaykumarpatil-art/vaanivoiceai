import fs from 'fs';
import path from 'path';

export interface KnowledgeItem {
  id: string;
  title: string;
  category: 'science' | 'technology' | 'programming' | 'mathematics' | 'history' | 'culture' | 'creator' | 'general' | 'geography' | 'health';
  keywords: string[];
  summary: string;
  content: string;
  spokenSummary: string;
  translations?: {
    hi?: {
      title: string;
      summary: string;
      content: string;
      spokenSummary: string;
    };
    mr?: {
      title: string;
      summary: string;
      content: string;
      spokenSummary: string;
    };
  };
}

declare const __dirname: string | undefined;

let KNOWLEDGE_CATALOG: KnowledgeItem[] = [];

try {
  let catalogPath = '';
  if (typeof __dirname !== 'undefined') {
    catalogPath = path.resolve(__dirname, '../data/knowledgeCatalog.json');
  } else {
    catalogPath = path.resolve(process.cwd(), 'src/data/knowledgeCatalog.json');
  }

  if (fs.existsSync(catalogPath)) {
    const raw = fs.readFileSync(catalogPath, 'utf-8');
    KNOWLEDGE_CATALOG = JSON.parse(raw);
  } else {
    const altPath = path.resolve(process.cwd(), 'server/src/data/knowledgeCatalog.json');
    if (fs.existsSync(altPath)) {
      const raw = fs.readFileSync(altPath, 'utf-8');
      KNOWLEDGE_CATALOG = JSON.parse(raw);
    }
  }
} catch (err) {
  console.warn('Could not read knowledgeCatalog.json:', err);
}

export { KNOWLEDGE_CATALOG };

export interface SearchMatch {
  item: KnowledgeItem;
  confidence: number;
  localizedContent: string;
  localizedSpoken: string;
}

/**
 * Searches the Knowledge Catalog for matching knowledge items based on query tokens.
 */
export function searchKnowledge(query: string, language: string = 'en'): SearchMatch | null {
  const normalized = (query || '').toLowerCase().trim();
  if (normalized.length < 2) return null;

  const stopWords = new Set([
    'what', 'is', 'the', 'a', 'an', 'tell', 'me', 'about', 'how', 'does', 'work',
    'who', 'in', 'on', 'of', 'and', 'to', 'for', 'explain', 'kay', 'aahe', 'kya',
    'hai', 'batao', 'sang', 'give', 'detail', 'details', 'brief'
  ]);
  const words = normalized
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 1 && !stopWords.has(w));

  let bestItem: KnowledgeItem | null = null;
  let highestScore = 0;

  for (const item of KNOWLEDGE_CATALOG) {
    let score = 0;

    // Check title match
    if (normalized.includes(item.title.toLowerCase())) {
      score += 50;
    }

    // Check keyword matches
    for (const kw of item.keywords) {
      const lowerKw = kw.toLowerCase();
      if (normalized.includes(lowerKw)) {
        score += 30;
      }
      for (const w of words) {
        if (lowerKw === w) {
          score += 20;
        } else if (lowerKw.includes(w) && w.length >= 4) {
          score += 10;
        }
      }
    }

    if (score > highestScore && score >= 25) {
      highestScore = score;
      bestItem = item;
    }
  }

  if (!bestItem) return null;

  let localizedContent = bestItem.content;
  let localizedSpoken = bestItem.spokenSummary;

  if (language === 'hi' && bestItem.translations?.hi) {
    localizedContent = bestItem.translations.hi.content;
    localizedSpoken = bestItem.translations.hi.spokenSummary;
  } else if (language === 'mr' && bestItem.translations?.mr) {
    localizedContent = bestItem.translations.mr.content;
    localizedSpoken = bestItem.translations.mr.spokenSummary;
  }

  return {
    item: bestItem,
    confidence: highestScore,
    localizedContent,
    localizedSpoken
  };
}

/**
 * Formats knowledge items into a compact context string for Gemini prompt grounding
 */
export function getKnowledgeContextForPrompt(query: string): string {
  const match = searchKnowledge(query, 'en');
  if (!match) return '';

  return `\nRELEVANT GROUNDED KNOWLEDGE:
[Topic: ${match.item.title} (${match.item.category})]
${match.item.summary}
${match.item.content.slice(0, 1000)}
`;
}
