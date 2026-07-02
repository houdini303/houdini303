import { useQuery } from '@tanstack/react-query';
import maplibregl from 'maplibre-gl';
import { useEffect, useRef } from 'react';
import { fetchVehicles, type Vehicle } from '../api.ts';
import { bearing, distanceMeters, lerp } from './geo.ts';
import { createVehicleIcon, createVehicleLabel, type VehicleLabelEl } from './marker.ts';

export const POLL_MS = 10_000;
const GLIDE_MS = 9_500; // plynulý přejezd mezi updaty (těsně pod poll → jede pořád)
const MIN_MOVE_M = 8; // pod tuto vzdálenost neaktualizujeme azimut (anti-jitter)
const ROT_EASE = 0.16; // rychlost dorotování k cílovému azimutu (per frame)

interface Tracked {
  icon: maplibregl.Marker; // leží na mapě, rotuje po směru jízdy
  label: maplibregl.Marker; // vzpřímený štítek s číslem linky
  labelEl: VehicleLabelEl;
  startLng: number;
  startLat: number;
  targetLng: number;
  targetLat: number;
  startTime: number;
  curBearing: number;
  targetBearing: number;
  hasBearing: boolean;
}

interface Props {
  map: maplibregl.Map;
  onSelect?: (v: Vehicle) => void;
}

// Fáze 3: živé pohyblivé vozy. Poll přes TanStack Query; mezi updaty se poloha
// i natočení každého vozu plynule interpolují (rAF) — vozy jedou hladce jako
// v Uberu. Ikona leží na mapě (naklání se s 3D perspektivou) a rotuje dle
// azimutu vypočteného z pohybu; nad ní plave vzpřímený štítek s číslem linky.
export function VehicleLayer({ map, onSelect }: Props) {
  const tracked = useRef(new Map<string, Tracked>());
  const rafRef = useRef<number>(0);
  const selectedId = useRef<string | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const { data } = useQuery({
    queryKey: ['vehicles'],
    queryFn: fetchVehicles,
    refetchInterval: POLL_MS,
  });

  // rAF smyčka — tweenuje polohu i rotaci všech markerů.
  useEffect(() => {
    const tick = () => {
      const now = performance.now();
      for (const t of tracked.current.values()) {
        const p = Math.min(1, (now - t.startTime) / GLIDE_MS);
        const lng = lerp(t.startLng, t.targetLng, p);
        const lat = lerp(t.startLat, t.targetLat, p);
        t.icon.setLngLat([lng, lat]);
        t.label.setLngLat([lng, lat]);

        if (t.hasBearing) {
          const diff = ((t.targetBearing - t.curBearing + 540) % 360) - 180;
          if (Math.abs(diff) > 0.3) {
            t.curBearing += diff * ROT_EASE;
            t.icon.setRotation(t.curBearing);
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Sesouhlasení markerů s novými daty (přidat / posunout target / odebrat).
  useEffect(() => {
    if (!data) return;
    const now = performance.now();
    const seen = new Set<string>();

    for (const v of data.vehicles) {
      seen.add(v.id);
      const existing = tracked.current.get(v.id);

      if (existing) {
        const cur = existing.icon.getLngLat(); // start = zobrazená poloha (žádný teleport)
        existing.startLng = cur.lng;
        existing.startLat = cur.lat;
        existing.targetLng = v.lon;
        existing.targetLat = v.lat;
        existing.startTime = now;

        if (distanceMeters(cur.lng, cur.lat, v.lon, v.lat) > MIN_MOVE_M) {
          existing.targetBearing = bearing(cur.lng, cur.lat, v.lon, v.lat);
          if (!existing.hasBearing) {
            existing.curBearing = existing.targetBearing;
            existing.icon.setRotation(existing.curBearing);
          }
          existing.hasBearing = true;
        }
      } else {
        const iconEl = createVehicleIcon(v.line, v.kind);
        const labelEl = createVehicleLabel(v.line, v.kind);
        const onClick = (e: Event) => {
          e.stopPropagation();
          select(v.id);
          map.flyTo({ center: [v.lon, v.lat], zoom: Math.max(map.getZoom(), 15), duration: 900 });
          onSelectRef.current?.(v);
        };
        iconEl.addEventListener('click', onClick);
        labelEl.root.addEventListener('click', onClick);

        const icon = new maplibregl.Marker({
          element: iconEl,
          anchor: 'center',
          rotationAlignment: 'map', // rotuje vůči severu mapy
          pitchAlignment: 'map', // leží na mapě → naklání se s pitchem
        })
          .setLngLat([v.lon, v.lat])
          .addTo(map);

        const label = new maplibregl.Marker({
          element: labelEl.root,
          anchor: 'center',
          offset: [0, -26], // plave nad vozem
        })
          .setLngLat([v.lon, v.lat])
          .addTo(map);

        tracked.current.set(v.id, {
          icon,
          label,
          labelEl,
          startLng: v.lon,
          startLat: v.lat,
          targetLng: v.lon,
          targetLat: v.lat,
          startTime: now,
          curBearing: 0,
          targetBearing: 0,
          hasBearing: false,
        });
      }
    }

    for (const [id, t] of tracked.current) {
      if (!seen.has(id)) {
        t.icon.remove();
        t.label.remove();
        tracked.current.delete(id);
        if (selectedId.current === id) selectedId.current = null;
      }
    }
  }, [data, map]);

  // úklid při odmontování
  useEffect(() => {
    const store = tracked.current;
    return () => {
      for (const t of store.values()) {
        t.icon.remove();
        t.label.remove();
      }
      store.clear();
    };
  }, []);

  function select(id: string) {
    if (selectedId.current && selectedId.current !== id) {
      tracked.current.get(selectedId.current)?.labelEl.setSelected(false);
    }
    selectedId.current = id;
    tracked.current.get(id)?.labelEl.setSelected(true);
  }

  return null;
}
