// Normalizovaný datový model (viz docs/03) — to, co proxy servíruje ven.

export type VehicleKind = 'trolleybus' | 'bus';

export interface Vehicle {
  id: string; // vid
  line: string; // "2"
  kind: VehicleKind; // odvozeno z čísla linky (API typ nedává)
  destination: string; // "Pardubičky,točna"
  lat: number;
  lon: number;
  delaySec: number | null; // z "time_difference" (00:00:52 → 52, náskok → záporné)
  currentStop: string;
  nextStop?: string;
  timestampUtc: string; // state_dtime
}

export interface Stop {
  number: number;
  name: string;
  lat?: number;
  lon?: number;
}

export interface Line {
  number: number;
  stops: Stop[];
  color: string;
}

// --- Raw schémata z online.dpmp.cz (jen pole, která používáme) ---

export interface RawLine {
  number: number;
  stops: RawStop[];
}

export interface RawStop {
  number: number;
  name: string;
  codes?: unknown[];
  index?: number;
  arrivalTime?: string;
  departureTime?: string;
}

export interface RawBus {
  vid: string;
  state_dtime: string;
  line_name: string;
  line_direction?: string;
  destination_name: string;
  last_stop_number?: string;
  last_stop_name?: string;
  current_stop_number?: string;
  current_stop_name?: string;
  current_stop_scheduled_departure?: string;
  time_difference?: string | null;
  connection_no?: number;
  gps_latitude: number;
  gps_longitude: number;
}

export interface RawConnection {
  connection: {
    line_number: number;
    number: number;
    stops: RawStop[];
  };
  from: string;
  to: string;
  bus: RawBus | null;
}
