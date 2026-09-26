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
