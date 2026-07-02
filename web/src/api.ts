// Tenký klient nad proxy (/api/*). Dev proxy směruje na Hono (port 8787).

export type VehicleKind = 'trolleybus' | 'bus';

export interface Vehicle {
  id: string;
  line: string;
  kind: VehicleKind;
  destination: string;
  lat: number;
  lon: number;
  delaySec: number | null;
  currentStop: string;
  nextStop?: string;
  timestampUtc: string;
}

export interface VehiclesResponse {
  updatedAt: string;
  count: number;
  linesFailed: number;
  vehicles: Vehicle[];
}

export async function fetchVehicles(): Promise<VehiclesResponse> {
  const res = await fetch('/api/vehicles');
  if (!res.ok) throw new Error(`/api/vehicles → HTTP ${res.status}`);
  return res.json();
}
