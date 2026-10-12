// CSS screen sizes, not viewport heights (Safari's toolbar changes the latter).
// One asset per orientation/theme; all assets contain only the existing brand symbol.
export const iphoneScreens = [
  [320, 568, 2], [375, 667, 2], [414, 736, 3], [375, 812, 3],
  [390, 844, 3], [393, 852, 3], [402, 874, 3], [414, 896, 2],
  [414, 896, 3], [428, 926, 3], [430, 932, 3], [440, 956, 3],
];

export function startupImageMedia(url, preference = "system") {
  const match = url.match(/\/(\d+)-(\d+)-(\d+)-(portrait|landscape)-(light|dark)\.png$/);
  if (!match) return null;
  const [, width, height, scale, orientation, theme] = match;
  const screen = `screen and (device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${scale}) and (orientation: ${orientation})`;
  if (preference === "light" || preference === "dark") return theme === preference ? screen : "not all";
  return `${screen} and (prefers-color-scheme: ${theme})`;
}

export function iosStartupImages(preference = "system") {
  return iphoneScreens.flatMap(([width, height, scale]) =>
    ["portrait", "landscape"].flatMap(orientation => ["light", "dark"].map(theme => {
      const url = `/icons/startup/${width}-${height}-${scale}-${orientation}-${theme}.png`;
      return { url, media: startupImageMedia(url, preference) ?? undefined };
    })));
}
