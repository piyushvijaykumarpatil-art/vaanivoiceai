/**
 * Spoken Text Sanitizer Pipeline:
 * Strips markdown symbols, code blocks, URLs, and noisy characters before passing to TTS.
 */
export function sanitizeTextForTTS(text: string): string {
  if (!text) return '';

  return text
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown links [title](url) -> title
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove raw URLs
    .replace(/https?:\/\/\S+/g, 'link')
    // Strip markdown formatting symbols: asterisks, hashes, underscores, tildes, blockquotes
    .replace(/[*#_~`>\[\]\(\)\{\}]/g, '')
    // Replace bullet dashes or numbers at start of lines with natural pauses
    .replace(/^\s*[-•*]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // Remove excessive exclamation/question marks
    .replace(/!{2,}/g, '!')
    .replace(/\?{2,}/g, '?')
    // Normalize spaces and newlines
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Creates a concise, natural, conversational spoken summary (1-3 sentences)
 * specifically optimized for ultra-fast, zero-freeze speech synthesis (TTS).
 * The full detailed Markdown is retained in the chat transcript.
 */
export function createSpokenSummaryForTTS(text: string, maxChars: number = 300): string {
  const sanitized = sanitizeTextForTTS(text);
  if (!sanitized) return '';
  if (sanitized.length <= maxChars) return sanitized;

  // Search for the cleanest sentence boundary before maxChars
  const cutZone = sanitized.slice(0, maxChars);
  const sentenceEndings = ['. ', '! ', '? ', '। '];
  let bestCut = -1;

  for (const end of sentenceEndings) {
    const idx = cutZone.lastIndexOf(end);
    if (idx > bestCut && idx >= 75) {
      bestCut = idx;
    }
  }

  if (bestCut !== -1) {
    return cutZone.slice(0, bestCut + 1).trim();
  }

  // Fallback to last clean word boundary
  const lastSpace = cutZone.lastIndexOf(' ');
  if (lastSpace >= 75) {
    return cutZone.slice(0, lastSpace).trim() + '.';
  }

  return cutZone.trim() + '.';
}
