export interface ThemeTokens {
  readonly bodyFontFamily: string;
  readonly monoFontFamily: string;
  readonly grainOpacity: number;
  readonly scrollbarSizePx: number;
}

export const forkThemeTokens: ThemeTokens = {
  bodyFontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  monoFontFamily: '"SF Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
  grainOpacity: 0.035,
  scrollbarSizePx: 6,
};
