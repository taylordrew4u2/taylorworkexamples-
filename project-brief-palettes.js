// These are optional colors for a client's project, not 4u Digital brand accents.
const palette = (id, name, colors) => Object.freeze({ id, name, colors: Object.freeze(colors.map(([name, hex]) => Object.freeze({ name, hex }))) });

export const briefPalettes = Object.freeze([
  palette("ink-paper", "Ink & paper", [["Ink", "#161616"], ["Slate", "#686868"], ["Pearl", "#E5E5E5"], ["White", "#FFFFFF"]]),
  palette("ocean-sand", "Ocean & sand", [["Deep navy", "#12304A"], ["Ocean", "#386789"], ["Sand", "#DFCCAB"], ["Cream", "#FAF6EE"]]),
  palette("forest-linen", "Forest & linen", [["Forest", "#244637"], ["Sage", "#7F9880"], ["Linen", "#E7DFCF"], ["Ivory", "#FAF8F1"]]),
  palette("clay-oat", "Clay & oat", [["Terracotta", "#AD6049"], ["Clay", "#C58A70"], ["Oat", "#E1CBB5"], ["Off-white", "#FBF7F2"]]),
  palette("charcoal-gold", "Charcoal & gold", [["Charcoal", "#232323"], ["Stone", "#9A948A"], ["Gold", "#C9A45C"], ["Cream", "#F6F1E7"]]),
  palette("denim-ice", "Denim & ice", [["Denim", "#2D4D6C"], ["Steel", "#7291AB"], ["Ice", "#DDE8EE"], ["White", "#FAFCFD"]]),
]);

export function paletteAnswerPrefix(selection) {
  return selection ? `Palette: ${selection.name} — ${selection.colors.map((color) => `${color.name} ${color.hex}`).join(", ")}.` : "";
}

export function formatPaletteAnswer(selection, notes = "") {
  const prefix = paletteAnswerPrefix(selection);
  const content = String(notes).trim();
  return prefix ? `${prefix}${content ? `\n\n${content}` : ""}` : content;
}

/** Recognize only our exact prefix, preserving all of the client's other words. */
export function parsePaletteAnswer(answer = "") {
  const content = String(answer);
  for (const selection of briefPalettes) {
    const prefix = paletteAnswerPrefix(selection);
    if (content === prefix || content.startsWith(`${prefix}\n`)) return { selection, notes: content.slice(prefix.length).replace(/^\r?\n(?:\r?\n)?/, "") };
  }
  return { selection: null, notes: content };
}
