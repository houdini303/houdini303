import { lineColor } from './color.ts';

export interface VehicleMarkerEl {
  root: HTMLDivElement;
  setBearing(deg: number): void;
  setSelected(sel: boolean): void;
}

// Vytvoří DOM marker vozu: barevný chip s číslem linky (vždy vzpřímený, čitelný)
// + směrová šipka, která rotuje kolem chipu podle azimutu jízdy.
export function createVehicleMarker(line: string): VehicleMarkerEl {
  const root = document.createElement('div');
  root.className = 'veh';

  const heading = document.createElement('div');
  heading.className = 'veh-heading';
  const arrow = document.createElement('span');
  arrow.className = 'veh-arrow';
  heading.appendChild(arrow);

  const chip = document.createElement('div');
  chip.className = 'veh-chip';
  chip.textContent = line;
  const color = lineColor(line);
  chip.style.background = color;
  heading.style.setProperty('--veh-color', color);

  root.appendChild(heading);
  root.appendChild(chip);

  let currentBearing = 0;
  return {
    root,
    setBearing(deg: number) {
      // krátká cesta při přechodu přes 360/0
      let d = deg;
      const diff = ((d - currentBearing + 540) % 360) - 180;
      d = currentBearing + diff;
      currentBearing = d;
      heading.style.transform = `rotate(${d}deg)`;
    },
    setSelected(sel: boolean) {
      root.classList.toggle('veh--selected', sel);
    },
  };
}
