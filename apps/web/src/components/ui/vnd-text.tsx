// Split only the currency glyph of an already formatted authoritative amount.
// Preserve every character; this component never parses, rounds or settles money.
export function VndText({ formatted }: { formatted: string }) {
  const parts = formatted.match(/^(.*?)(\s*₫)$/u);
  if (!parts) return formatted;
  return <><span className="vnd-number" data-wide={parts[1].length > 13 || undefined} data-extra-wide={parts[1].length > 16 || undefined}>{parts[1]}</span><span className="vnd-unit">{parts[2]}</span></>;
}
