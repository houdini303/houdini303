import type { VehicleKind } from '../api.ts';
import { lineColor } from './color.ts';

export interface VehicleLabelEl {
  root: HTMLDivElement;
  setSelected(sel: boolean): void;
}

// Vzpřímený štítek s číslem linky (vždy čelem k obrazovce, čitelný) — plave
// nad 3D modelem vozu.
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
