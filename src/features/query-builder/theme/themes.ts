export const THEME_STORAGE_KEY = "qb-theme";
export const THEME_EVENT = "qb-theme-change";

export const THEMES = [
  { id: "brown-light", label: "Editorial", swatch: "#dcc6ad" },
  { id: "sage", label: "Sage Studio", swatch: "#c8c9b7" },
  { id: "brown", label: "Olive Night", swatch: "#1f2a16" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: ThemeId = "brown";

export function isThemeId(value: string | null): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}
