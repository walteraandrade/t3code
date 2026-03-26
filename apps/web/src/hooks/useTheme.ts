import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { OmarchyColors } from "@t3tools/contracts";
import { readNativeApi } from "../nativeApi";

type Theme = "light" | "dark" | "system" | "omarchy";
type ThemeSnapshot = {
  theme: Theme;
  systemDark: boolean;
};

const STORAGE_KEY = "t3code:theme";
const MEDIA_QUERY = "(prefers-color-scheme: dark)";

let listeners: Array<() => void> = [];
let lastSnapshot: ThemeSnapshot | null = null;
let lastDesktopTheme: "light" | "dark" | "system" | null = null;
let omarchyLoadGeneration = 0;

function emitChange() {
  for (const listener of listeners) listener();
}

function getSystemDark(): boolean {
  return window.matchMedia(MEDIA_QUERY).matches;
}

function getStored(): Theme {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === "light" || raw === "dark" || raw === "system" || raw === "omarchy") return raw;
  return "system";
}

// ── Hex colour helpers ────────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!result) return null;
  return {
    r: parseInt(result[1]!, 16),
    g: parseInt(result[2]!, 16),
    b: parseInt(result[3]!, 16),
  };
}

function mixWithWhite(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.round(rgb.r + (255 - rgb.r) * amount);
  const g = Math.round(rgb.g + (255 - rgb.g) * amount);
  const b = Math.round(rgb.b + (255 - rgb.b) * amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(0,0,0,${alpha})`;
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
}

// ── Omarchy inline style application ─────────────────────────────────

/**
 * All CSS custom property names that the Omarchy theme overrides.
 * Tracked so `removeOmarchyTheme` can clean up precisely.
 */
const OMARCHY_CSS_VARS = [
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--muted",
  "--muted-foreground",
  "--accent",
  "--accent-foreground",
  "--destructive",
  "--destructive-foreground",
  "--border",
  "--input",
  "--ring",
  "--info",
  "--info-foreground",
  "--success",
  "--success-foreground",
  "--warning",
  "--warning-foreground",
  "--sidebar",
  "--sidebar-foreground",
  "--sidebar-primary",
  "--sidebar-primary-foreground",
  "--sidebar-accent",
  "--sidebar-accent-foreground",
  "--sidebar-border",
  "--sidebar-ring",
] as const;

/**
 * Apply the Omarchy palette by setting CSS custom properties directly on
 * `document.documentElement` as **inline styles**. Inline styles have the
 * highest possible specificity and are not affected by stylesheet injection
 * order, making this approach robust in both dev (Vite HMR) and production.
 */
function applyOmarchyTheme(colors: OmarchyColors): void {
  const card = mixWithWhite(colors.background, 0.08);
  const surface = hexToRgba(colors.color0, 0.15);
  const el = document.documentElement;

  el.style.setProperty("--background", colors.background);
  el.style.setProperty("--foreground", colors.foreground);
  el.style.setProperty("--card", card);
  el.style.setProperty("--card-foreground", colors.foreground);
  el.style.setProperty("--popover", card);
  el.style.setProperty("--popover-foreground", colors.foreground);
  el.style.setProperty("--primary", colors.accent);
  el.style.setProperty("--primary-foreground", colors.color15);
  el.style.setProperty("--secondary", surface);
  el.style.setProperty("--secondary-foreground", colors.foreground);
  el.style.setProperty("--muted", surface);
  el.style.setProperty("--muted-foreground", colors.color7);
  el.style.setProperty("--accent", surface);
  el.style.setProperty("--accent-foreground", colors.foreground);
  el.style.setProperty("--destructive", colors.color1);
  el.style.setProperty("--destructive-foreground", colors.color9);
  el.style.setProperty("--border", hexToRgba(colors.color8, 0.25));
  el.style.setProperty("--input", hexToRgba(colors.color8, 0.3));
  el.style.setProperty("--ring", colors.accent);
  el.style.setProperty("--info", colors.color4);
  el.style.setProperty("--info-foreground", colors.color12);
  el.style.setProperty("--success", colors.color2);
  el.style.setProperty("--success-foreground", colors.color10);
  el.style.setProperty("--warning", colors.color3);
  el.style.setProperty("--warning-foreground", colors.color11);
  el.style.setProperty("--sidebar", colors.background);
  el.style.setProperty("--sidebar-foreground", colors.color7);
  el.style.setProperty("--sidebar-primary", colors.accent);
  el.style.setProperty("--sidebar-primary-foreground", colors.color15);
  el.style.setProperty("--sidebar-accent", surface);
  el.style.setProperty("--sidebar-accent-foreground", colors.color15);
  el.style.setProperty("--sidebar-border", hexToRgba(colors.color8, 0.25));
  el.style.setProperty("--sidebar-ring", colors.accent);
}

function removeOmarchyTheme(): void {
  const el = document.documentElement;
  for (const prop of OMARCHY_CSS_VARS) {
    el.style.removeProperty(prop);
  }
}

// ── Async Omarchy colour loader ───────────────────────────────────────

async function loadAndApplyOmarchyColors(): Promise<void> {
  const gen = ++omarchyLoadGeneration;
  try {
    const api = readNativeApi();
    if (!api) return;
    const result = await api.theme.getOmarchyColors();
    // Bail out if the user switched theme while we were waiting
    if (gen !== omarchyLoadGeneration) return;
    if (getStored() !== "omarchy") return;
    if (result.available && result.colors) {
      applyOmarchyTheme(result.colors);
    }
  } catch {
    // Silent degradation — app stays dark but without custom palette vars
  }
}

// ── Core theme application ────────────────────────────────────────────

function syncDesktopTheme(theme: "light" | "dark" | "system") {
  const bridge = window.desktopBridge;
  if (!bridge || lastDesktopTheme === theme) {
    return;
  }

  lastDesktopTheme = theme;
  void bridge.setTheme(theme).catch(() => {
    if (lastDesktopTheme === theme) {
      lastDesktopTheme = null;
    }
  });
}

function applyTheme(theme: Theme, suppressTransitions = false) {
  if (suppressTransitions) {
    document.documentElement.classList.add("no-transitions");
  }

  if (theme === "omarchy") {
    document.documentElement.classList.add("dark");
    syncDesktopTheme("dark");
    void loadAndApplyOmarchyColors();
  } else {
    removeOmarchyTheme();
    const isDark = theme === "dark" || (theme === "system" && getSystemDark());
    document.documentElement.classList.toggle("dark", isDark);
    syncDesktopTheme(theme);
  }

  if (suppressTransitions) {
    // Force a reflow so the no-transitions class takes effect before removal
    // oxlint-disable-next-line no-unused-expressions
    document.documentElement.offsetHeight;
    requestAnimationFrame(() => {
      document.documentElement.classList.remove("no-transitions");
    });
  }
}

// Apply immediately on module load to prevent flash
applyTheme(getStored());

function getSnapshot(): ThemeSnapshot {
  const theme = getStored();
  const systemDark = theme === "system" ? getSystemDark() : false;

  if (lastSnapshot && lastSnapshot.theme === theme && lastSnapshot.systemDark === systemDark) {
    return lastSnapshot;
  }

  lastSnapshot = { theme, systemDark };
  return lastSnapshot;
}

function subscribe(listener: () => void): () => void {
  listeners.push(listener);

  // Listen for system preference changes
  const mq = window.matchMedia(MEDIA_QUERY);
  const handleChange = () => {
    if (getStored() === "system") applyTheme("system", true);
    emitChange();
  };
  mq.addEventListener("change", handleChange);

  // Listen for storage changes from other tabs
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      applyTheme(getStored(), true);
      emitChange();
    }
  };
  window.addEventListener("storage", handleStorage);

  return () => {
    listeners = listeners.filter((l) => l !== listener);
    mq.removeEventListener("change", handleChange);
    window.removeEventListener("storage", handleStorage);
  };
}

export function useTheme() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot);
  const theme = snapshot.theme;

  const resolvedTheme: "light" | "dark" =
    theme === "system"
      ? snapshot.systemDark
        ? "dark"
        : "light"
      : theme === "omarchy"
        ? "dark"
        : theme;

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next, true);
    emitChange();
  }, []);

  // Keep DOM in sync on mount/change
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return { theme, setTheme, resolvedTheme } as const;
}
