/**
 * Omarchy theme integration types.
 *
 * Omarchy is DHH's Arch Linux + Hyprland distribution with a 24-token
 * `colors.toml` theming system that propagates a palette across every desktop
 * app. These types represent the parsed result of reading the active theme.
 */

export interface OmarchyColors {
  background: string;
  foreground: string;
  accent: string;
  cursor: string;
  selectionForeground: string;
  selectionBackground: string;
  color0: string;
  color1: string;
  color2: string;
  color3: string;
  color4: string;
  color5: string;
  color6: string;
  color7: string;
  color8: string;
  color9: string;
  color10: string;
  color11: string;
  color12: string;
  color13: string;
  color14: string;
  color15: string;
}

export interface OmarchyThemeResult {
  available: boolean;
  themeName?: string;
  colors?: OmarchyColors;
}
