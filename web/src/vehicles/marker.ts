import type { VehicleKind } from '../api.ts';
import { lineColor } from './color.ts';

// Top-down silueta vozu (přední sklo = předek → čitelný směr i za stání).
// Ikona leží na mapě (pitchAlignment 'map') → naklání se s 3D perspektivou
// a rotuje po směru jízdy. Trolejbus má navíc sběrače (poles) vzadu.
function vehicleSvg(color: VehicleKindColor): string {
  const { fill, kind } = color;
  const poles =
    kind === 'trolleybus'
      ? `<line x1="12" y1="39" x2="9.5" y2="45" stroke="#dbe4f0" stroke-width="1.4" stroke-linecap="round"/>
         <line x1="18" y1="39" x2="20.5" y2="45" stroke="#dbe4f0" stroke-width="1.4" stroke-linecap="round"/>
         <circle cx="9.5" cy="45" r="1.3" fill="#dbe4f0"/>
         <circle cx="20.5" cy="45" r="1.3" fill="#dbe4f0"/>`
      : '';
  return `
    <svg width="30" height="46" viewBox="0 0 30 46" xmlns="http://www.w3.org/2000/svg">
      ${poles}
      <rect x="5" y="4" width="20" height="38" rx="7" fill="${fill}" stroke="#ffffff" stroke-width="2"/>
      <rect x="8" y="7.5" width="14" height="7" rx="3" fill="rgba(255,255,255,0.92)"/>
      <rect x="8.5" y="20" width="13" height="9" rx="2" fill="rgba(0,0,0,0.16)"/>
      <rect x="8" y="34" width="14" height="5" rx="2" fill="rgba(0,0,0,0.28)"/>
    </svg>`;
}

interface VehicleKindColor {
  fill: string;
  kind: VehicleKind;
}

// Ikona vozu (leží na mapě, rotuje se přes marker.setRotation).
export function createVehicleIcon(line: string, kind: VehicleKind): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'veh-icon';
  el.innerHTML = vehicleSvg({ fill: lineColor(line), kind });
  return el;
}

export interface VehicleLabelEl {
  root: HTMLDivElement;
  setSelected(sel: boolean): void;
}

// Vzpřímený štítek s číslem linky (vždy čelem k obrazovce, čitelný).
export function createVehicleLabel(line: string, kind: VehicleKind): VehicleLabelEl {
  const root = document.createElement('div');
  root.className = 'veh-label';
  if (kind === 'trolleybus') root.classList.add('veh-label--trolley');
  root.textContent = line;
  root.style.setProperty('--veh-color', lineColor(line));
  return {
    root,
    setSelected(sel: boolean) {
      root.classList.toggle('veh-label--selected', sel);
    },
  };
}
