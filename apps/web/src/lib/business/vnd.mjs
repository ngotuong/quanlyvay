// Accept plain digits or complete Vietnamese thousands groups. Never discard signs/decimals.
export function normalizeVnd(value) {
  const text = String(value).trim();
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)$/.test(text)) return text;
  return text.replaceAll(".", "").replace(/^0+(?=\d)/, "");
}

export function formatVndDigits(value) {
  return String(value).replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
