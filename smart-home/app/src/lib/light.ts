import type { HaEntity } from '../ha/types';

// Pomocné funkce nad světelnou entitou HA.

const COLOR_MODES_WITH_BRIGHTNESS = ['brightness', 'color_temp', 'hs', 'rgb', 'rgbw', 'rgbww', 'xy'];
const COLOR_MODES_WITH_RGB = ['hs', 'rgb', 'rgbw', 'rgbww', 'xy'];

function modes(entity: HaEntity): string[] {
  const m = entity.attributes.supported_color_modes;
  return Array.isArray(m) ? (m as string[]) : [];
}

export function isOn(entity: HaEntity | undefined): boolean {
  return entity?.state === 'on';
}

export function supportsBrightness(entity: HaEntity): boolean {
  return modes(entity).some((m) => COLOR_MODES_WITH_BRIGHTNESS.includes(m));
}

export function supportsRgb(entity: HaEntity): boolean {
  return modes(entity).some((m) => COLOR_MODES_WITH_RGB.includes(m));
}

export function supportsColorTemp(entity: HaEntity): boolean {
  return modes(entity).includes('color_temp');
}

/** Jas 0–100 % z atributu brightness (0–255). */
export function brightnessPct(entity: HaEntity): number {
  const b = entity.attributes.brightness;
  if (typeof b !== 'number') return isOn(entity) ? 100 : 0;
  return Math.round((b / 255) * 100);
}

/** CSS barva pro náhled/indikátor světla. */
export function cssColor(entity: HaEntity): string {
  const rgb = entity.attributes.rgb_color;
  if (Array.isArray(rgb) && rgb.length >= 3) {
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  }
  return '#ffd9a0'; // teplá bílá jako výchozí
}

export const RGB_PRESETS: { name: string; rgb: [number, number, number] }[] = [
  { name: 'Bílá', rgb: [255, 241, 224] },
  { name: 'Teplá', rgb: [255, 160, 60] },
  { name: 'Červená', rgb: [255, 70, 70] },
  { name: 'Zelená', rgb: [80, 230, 140] },
  { name: 'Modrá', rgb: [90, 170, 255] },
  { name: 'Fialová', rgb: [180, 100, 255] },
];

export const CT_PRESETS: { name: string; kelvin: number }[] = [
  { name: 'Teplá', kelvin: 2700 },
  { name: 'Neutrální', kelvin: 4000 },
  { name: 'Studená', kelvin: 6000 },
];
