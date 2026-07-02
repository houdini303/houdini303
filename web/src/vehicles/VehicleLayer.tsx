import { useQuery } from '@tanstack/react-query';
import type maplibregl from 'maplibre-gl';
import { useEffect, useRef } from 'react';
import { fetchVehicles, type Vehicle } from '../api.ts';
import { Vehicles3D } from './vehicles3d.ts';

export const POLL_MS = 10_000;

interface Props {
  map: maplibregl.Map;
  onSelect?: (v: Vehicle) => void;
}

// Fáze 3 + 3D: živé vozy jako skutečné 3D modely (Three.js custom layer).
// Poll přes TanStack Query → controller.sync; rAF → controller.tick (interpolace
// polohy i rotace + triggerRepaint).
export function VehicleLayer({ map, onSelect }: Props) {
  const ctrlRef = useRef<Vehicles3D | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const { data } = useQuery({
    queryKey: ['vehicles'],
    queryFn: fetchVehicles,
    refetchInterval: POLL_MS,
  });

  useEffect(() => {
    const ctrl = new Vehicles3D(map, (v) => onSelectRef.current?.(v));
    ctrlRef.current = ctrl;
    if (import.meta.env.DEV) (window as unknown as { __map: unknown }).__map = map;

    const add = () => {
      if (!map.getLayer('vehicles-3d')) map.addLayer(ctrl.layer);
    };
    // mapu dostáváme z onReady (po 'load'), ale styl může být ještě rozpracovaný
    // (fly-in, sprite) → počkej na 'idle', které po dokončení spolehlivě přijde.
    if (map.isStyleLoaded()) add();
    else map.on('idle', add);

    return () => {
      map.off('idle', add);
      ctrl.dispose();
      ctrlRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    if (data) ctrlRef.current?.sync(data.vehicles);
  }, [data]);

  return null;
}
