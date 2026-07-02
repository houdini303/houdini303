import type { Line, RawConnection, RawLine, Stop, Vehicle, VehicleKind } from './types.js';

// Trolejbusové linky v Pardubicích (zdroj: trolejbus.cz, DPMP JŘ 2026).
// API typ vozidla nedává → odvozujeme z čísla linky. Zbytek = autobus.
const TROLLEYBUS_LINES = new Set([1, 2, 3, 4, 5, 7, 11, 13, 27, 33]);

export function vehicleKind(line: string): VehicleKind {
  const n = Number(String(line).replace(/\D/g, ''));
  return TROLLEYBUS_LINES.has(n) ? 'trolleybus' : 'bus';
}

// "00:00:52" → 52 ; "-00:01:30" → -90 ; "None"/null/"" → null
export function parseDelaySec(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (s === '' || s.toLowerCase() === 'none' || s.toLowerCase() === 'null') return null;
  const neg = s.startsWith('-');
  const m = s.replace(/^[-+]/, '').match(/^(\d+):(\d{2}):(\d{2})$/);
  if (!m) return null;
  const secs = Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
  return neg ? -secs : secs;
}

// nextStop se dopočítá z connection.stops + aktuální zastávky.
// Číslování current_stop_number (např. "18002") nesedí 1:1 na stop.number (180),
// tak matchujeme primárně podle názvu, sekundárně podle prefixu čísla.
function computeNextStop(conn: RawConnection): string | undefined {
  const stops = conn.connection?.stops;
  const bus = conn.bus;
  if (!stops?.length || !bus) return undefined;

  const curName = bus.current_stop_name?.trim();
  let idx = curName ? stops.findIndex((s) => s.name.trim() === curName) : -1;

  if (idx === -1 && bus.current_stop_number) {
    const num = Number(String(bus.current_stop_number).slice(0, -2)); // "18002" → 180
    if (Number.isFinite(num)) idx = stops.findIndex((s) => s.number === num);
  }

  if (idx >= 0 && idx + 1 < stops.length) return stops[idx + 1].name;
  return undefined;
}

export function normalizeVehicle(conn: RawConnection): Vehicle | null {
  const bus = conn.bus;
  if (!bus || bus.gps_latitude == null || bus.gps_longitude == null) return null;

  return {
    id: bus.vid,
    line: bus.line_name,
    kind: vehicleKind(bus.line_name),
    destination: bus.destination_name,
    lat: bus.gps_latitude,
    lon: bus.gps_longitude,
    delaySec: parseDelaySec(bus.time_difference),
    currentStop: bus.current_stop_name ?? '',
    nextStop: computeNextStop(conn),
    timestampUtc: bus.state_dtime,
  };
}

// Deterministická barva linky (HSL po zlatém řezu) — stabilní napříč refreshi.
const GOLDEN = 137.508;
export function lineColor(lineNumber: number): string {
  const hue = Math.round((lineNumber * GOLDEN) % 360);
  return `hsl(${hue}, 70%, 55%)`;
}

export function normalizeLine(raw: RawLine): Line {
  const stops: Stop[] = raw.stops.map((s) => ({ number: s.number, name: s.name }));
  return { number: raw.number, stops, color: lineColor(raw.number) };
}
