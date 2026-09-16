const HASHTAG_RE = /#([a-zA-Z0-9_]{1,50})/g;
const MENTION_RE = /@([a-zA-Z0-9_]{1,30})/g;

function extractUnique(text: string | null | undefined, regex: RegExp): string[] {
  if (!text) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const match of text.matchAll(regex)) {
    const value = match[1].toLowerCase();
    if (!seen.has(value)) {
      seen.add(value);
      result.push(value);
    }
  }
  return result;
}

export function extractHashtags(text: string | null | undefined): string[] {
  return extractUnique(text, HASHTAG_RE);
}

export function extractMentionHandles(text: string | null | undefined): string[] {
  return extractUnique(text, MENTION_RE);
}

export interface ComposerToken {
  trigger: "#" | "@";
  query: string;
  start: number;
  end: number;
}

/**
 * Finds the #hashtag or @mention word the caret is currently positioned
 * inside, if any, so a composer can offer autocomplete for it.
 */
export function getActiveComposerToken(
  text: string,
  caretIndex: number,
): ComposerToken | null {
  const upToCaret = text.slice(0, caretIndex);
  const wordStart = Math.max(
    upToCaret.lastIndexOf(" "),
    upToCaret.lastIndexOf("\n"),
  );
  const word = upToCaret.slice(wordStart + 1);

  const trigger = word[0];
  if (trigger !== "#" && trigger !== "@") return null;

  const query = word.slice(1);
  if (!/^[a-zA-Z0-9_]*$/.test(query)) return null;

  return {
    trigger,
    query,
    start: wordStart + 1,
    end: caretIndex,
  };
}
