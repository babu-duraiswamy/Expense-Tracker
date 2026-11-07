export type Theme = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "theme";
export const THEME_CHANGE_EVENT = "theme-change";

export function readTheme(): Theme {
  const stored =
    typeof localStorage === "undefined" ? null : localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "system";
}

export function applyTheme(theme: Theme): void {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", dark);
}

export function setTheme(theme: Theme): void {
  if (theme === "system") localStorage.removeItem(THEME_STORAGE_KEY);
  else localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

/** Runs before first paint so the page never flashes the wrong theme. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var d=t==='dark'||((t!=='light')&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;
