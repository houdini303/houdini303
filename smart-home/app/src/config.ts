// Konfigurace připojení k Home Assistantu.
// Priorita: uložené v prohlížeči (localStorage) > proměnné z .env > výchozí (demo).

export interface AppConfig {
  hassUrl: string;
  token: string;
  demo: boolean;
}

const STORAGE_KEY = 'smart-home.config';

const envUrl = (import.meta.env.VITE_HASS_URL as string | undefined) ?? '';
const envToken = (import.meta.env.VITE_HASS_TOKEN as string | undefined) ?? '';
const envDemo = (import.meta.env.VITE_DEMO as string | undefined) === 'true';

export function loadConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppConfig;
  } catch {
    /* ignoruj poškozený localStorage */
  }
  // Bez uloženého nastavení: použij .env, a když není token, spusť demo.
  const demo = envDemo || !envToken;
  return { hassUrl: envUrl, token: envToken, demo };
}

export function saveConfig(config: AppConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}
