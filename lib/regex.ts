// Matches the text literally: "c++" or "(a+)+$" typed in a search box
// must not be read as a regex pattern (one can crash, the other hang)
export const escapeRegex = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
