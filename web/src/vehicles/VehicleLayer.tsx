import { useQuery } from '@tanstack/react-query';
import maplibregl from 'maplibre-gl';
import { useEffect, useRef } from 'react';
import { fetchVehicles, type Vehicle } from '../api.ts';
import { bearing, distanceMeters, lerp } from './geo.ts';
import { createVehicleMarker, type VehicleMarkerEl } from './marker.ts';

export const POLL_MS = 10_000;
const GLIDE_MS = 9_500; // plynulý přejezd mezi updaty (těsně pod poll → jede pořád)
const MIN_MOVE_M = 8; // pod tuto vzdálenost neaktualizujeme azimut (anti-jitter)

interface Tracked {
  marker: maplibregl.Marker;
  el: VehicleMarkerEl;
  startLng: number;
  startLat: number;
  targetLng: number;
  targetLat: number;
  startTime: number;
  bearing: number;
}

interface Props {
  map: maplibregl.Map;
  onSelect?: (v: Vehicle) => void;
}

// Fáze 3: živé pohyblivé vozy. Poll přes TanStack Query; mezi updaty se poloha
// každého vozu plynule interpoluje (rAF glide) a ikona se natáčí dle azimutu
// vypočteného z pohybu — vozy tak jedou hladce jako v Uberu, ne poskakují.
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

  // rAF smyčka — běží po celou dobu života vrstvy a tweenuje všechny markery.
  useEffect(() => {
    const tick = () => {
      const now = performance.now();
      for (const t of tracked.current.values()) {
        const p = Math.min(1, (now - t.startTime) / GLIDE_MS);
        t.marker.setLngLat([
          lerp(t.startLng, t.targetLng, p),
          lerp(t.startLat, t.targetLat, p),
        ]);
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
        // start = aktuálně zobrazená poloha (žádný teleport)
        const cur = existing.marker.getLngLat();
        existing.startLng = cur.lng;
        existing.startLat = cur.lat;
        existing.targetLng = v.lon;
        existing.targetLat = v.lat;
        existing.startTime = now;

        const moved = distanceMeters(cur.lng, cur.lat, v.lon, v.lat);
        if (moved > MIN_MOVE_M) {
          existing.bearing = bearing(cur.lng, cur.lat, v.lon, v.lat);
          existing.el.setBearing(existing.bearing);
        }
      } else {
        const el = createVehicleMarker(v.line);
        el.root.addEventListener('click', (e) => {
          e.stopPropagation();
          select(v.id);
          map.flyTo({ center: [v.lon, v.lat], zoom: Math.max(map.getZoom(), 15), duration: 900 });
          onSelectRef.current?.(v);
        });
        const marker = new maplibregl.Marker({ element: el.root, anchor: 'center' })
          .setLngLat([v.lon, v.lat])
          .addTo(map);
        tracked.current.set(v.id, {
          marker,
          el,
          startLng: v.lon,
          startLat: v.lat,
          targetLng: v.lon,
          targetLat: v.lat,
          startTime: now,
          bearing: 0,
        });
      }
    }

    // odeber vozy, které už nejsou v provozu
    for (const [id, t] of tracked.current) {
      if (!seen.has(id)) {
        t.marker.remove();
        tracked.current.delete(id);
        if (selectedId.current === id) selectedId.current = null;
      }
    }
  }, [data, map]);

  // úklid všech markerů při odmontování
  useEffect(() => {
    const store = tracked.current;
    return () => {
      for (const t of store.values()) t.marker.remove();
      store.clear();
    };
  }, []);

  function select(id: string) {
    if (selectedId.current && selectedId.current !== id) {
      tracked.current.get(selectedId.current)?.el.setSelected(false);
    }
    selectedId.current = id;
    tracked.current.get(id)?.el.setSelected(true);
  }

  return null;
}
