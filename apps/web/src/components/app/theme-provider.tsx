"use client";

import { createContext, useCallback, useContext, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { parseTheme, themeColors, themeCookieName } from "@/lib/app/theme.mjs";
import { startupImageMedia } from "@/lib/app/ios-startup.mjs";

export type ThemePreference = "light" | "dark" | "system";
const ThemeContext = createContext<{ preference: ThemePreference; setPreference: (value: ThemePreference) => void; storageError: boolean }>({ preference: "system", setPreference: () => {}, storageError: false });
const deviceQuery = "(prefers-color-scheme: dark)";
function subscribeDevice(onChange: () => void) {
  const query = window.matchMedia(deviceQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
const readDevice = () => window.matchMedia(deviceQuery).matches;
const subscribeHydration = () => () => {};

function applyDocumentTheme(preference: ThemePreference) {
  if (document.documentElement.dataset.theme !== preference) document.documentElement.dataset.theme = preference;
  for (const entry of themeColors(preference)) {
    const meta = document.querySelector<HTMLMetaElement>(`meta[name="theme-color"][media="${entry.media}"]`);
    if (meta && meta.content !== entry.color) meta.content = entry.color;
  }
  // iOS uses head links for the next standalone launch. Keep them aligned with a
  // manual preference, including when cached history restores an older document head.
  for (const link of document.querySelectorAll<HTMLLinkElement>('link[rel="apple-touch-startup-image"]')) {
    const media = startupImageMedia(link.href, preference);
    if (media && link.media !== media) link.media = media;
  }
}

export function ThemeProvider({ children, initialPreference }: { children: ReactNode; initialPreference: ThemePreference }) {
  const [preference, setTheme] = useState(initialPreference);
  const [storageError, setStorageError] = useState(false);
  const desiredTheme = useRef(initialPreference);
  useLayoutEffect(() => {
    const sync = () => applyDocumentTheme(desiredTheme.current);
    sync();
    // Cached SPA history can restore viewport metadata from an older preference.
    // Repair head changes before the next paint; equality checks prevent observer loops.
    const observer = new MutationObserver(sync);
    observer.observe(document.head, { childList: true, subtree: true, attributes: true, attributeFilter: ["content", "media", "name"] });
    return () => observer.disconnect();
  }, []);
  function setPreference(value: ThemePreference) {
    let next = parseTheme(value);
    let saved = false;
    try {
      document.cookie = `${themeCookieName}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
      saved = document.cookie.split(";").some(item => item.trim() === `${themeCookieName}=${next}`);
    } catch { /* Cookie access may be blocked; system remains usable. */ }
    if (!saved) next = "system";
    setStorageError(!saved);
    desiredTheme.current = next;
    applyDocumentTheme(next);
    setTheme(next);
  }
  return <ThemeContext.Provider value={{ preference, setPreference, storageError }}>{children}</ThemeContext.Provider>;
}

export function ThemeSettings() {
  const { preference, setPreference, storageError } = useContext(ThemeContext);
  const subscribe = useCallback((onChange: () => void) => preference === "system" ? subscribeDevice(onChange) : () => {}, [preference]);
  const deviceDark = useSyncExternalStore(subscribe, readDevice, () => false);
  const hydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const effective = preference === "system" ? (deviceDark ? "Tối" : "Sáng") : (preference === "dark" ? "Tối" : "Sáng");
  return <section className="surface-card detail-section theme-settings" aria-labelledby="theme-settings-title">
    <h2 id="theme-settings-title">Giao diện</h2>
    <p className="notes-copy">Lựa chọn này chỉ lưu trên trình duyệt hiện tại.</p>
    <fieldset className="theme-options"><legend>Chế độ giao diện</legend>
      {([{ value: "light", label: "Sáng" }, { value: "dark", label: "Tối" }, { value: "system", label: "Theo thiết bị" }] as const).map(item =>
        <label key={item.value} data-selected={preference === item.value}><input type="radio" name="theme-preference" value={item.value} checked={preference === item.value} onChange={() => setPreference(item.value)} />{item.label}</label>)}
    </fieldset>
    <p className="field-hint" role="status">{preference === "system" ? `Đang theo thiết bị${hydrated ? ` · ${effective}` : ""}` : `Đang dùng giao diện ${effective}`}</p>
    {storageError ? <p className="action-message" role="status">Trình duyệt không cho lưu lựa chọn. Giao diện đang theo thiết bị.</p> : null}
  </section>;
}
