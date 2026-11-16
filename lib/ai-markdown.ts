// AI models sometimes put HTML line breaks (<br>, <br/>, <br />) in their
// markdown, often inside tables. The answer editor (MDXEditor) can't open
// raw HTML, so each one becomes a space.
// Code is left alone: in a fenced block (``` or ~~~) or an inline `code`
// span, "<br>" is part of the example (e.g. an HTML snippet).
const BR_TAG = /<br\s*\/?>/gi;
const FENCE = /^ {0,3}(`{3,}|~{3,})/;
// Splits a line into text and `inline code` (odd indexes are code)
const INLINE_CODE = /(`+[^`]*`+)/;

export const cleanAIMarkdown = (markdown: string): string => {
  let fence: string | null = null;

  const lines = markdown.split("\n").map((line) => {
    const match = FENCE.exec(line);
    if (match) {
      const marker = match[1];
      // A fence closes with the same character, at least as many times
      if (fence === null) fence = marker;
      else if (marker[0] === fence[0] && marker.length >= fence.length)
        fence = null;
      return line;
    }
    if (fence !== null) return line;

    return line
      .split(INLINE_CODE)
      .map((part, i) => (i % 2 === 1 ? part : part.replace(BR_TAG, " ")))
      .join("");
  });

  return lines.join("\n").trim();
};
