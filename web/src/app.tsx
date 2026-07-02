import { useQuery } from '@tanstack/react-query';
import type maplibregl from 'maplibre-gl';
import { useState } from 'react';
import { fetchLines, fetchVehicles } from './api.ts';
import { MapView } from './map/MapView.tsx';
import { TransitSheet } from './sheet/TransitSheet.tsx';
import { POLL_MS, VehicleLayer } from './vehicles/VehicleLayer.tsx';

// Fáze 4: fullscreen mapa + živé vozy + tažitelný bottom sheet (search, linky).
export function App() {
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const { data, isError } = useQuery({
    queryKey: ['vehicles'],
    queryFn: fetchVehicles,
    refetchInterval: POLL_MS,
  });
  const { data: lines } = useQuery({
    queryKey: ['lines'],
    queryFn: fetchLines,
    staleTime: 60 * 60 * 1000,
  });

  return (
    <>
      <MapView onReady={setMap} />
      {map && <VehicleLayer map={map} />}
      <LivePill count={data?.count} error={isError} />
      {map && (
        <TransitSheet map={map} lines={lines ?? []} vehicles={data?.vehicles ?? []} />
      )}
    </>
  );
}

function LivePill({ count, error }: { count?: number; error: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(env(safe-area-inset-top) + 14px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 6,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px',
        borderRadius: 999,
        background: 'rgba(20,26,38,0.82)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        fontSize: 13,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: error ? 'var(--err)' : 'var(--ok)',
          animation: error ? 'none' : 'livedot 1.6s ease-in-out infinite',
        }}
      />
      {error ? (
        <span style={{ color: 'var(--err)' }}>Živá data nedostupná</span>
      ) : count == null ? (
        <span style={{ color: 'var(--muted)' }}>Připojuji živý provoz…</span>
      ) : (
        <span>
          <span style={{ color: 'var(--accent)', fontWeight: 800 }}>{count}</span> vozů
          MHD živě
        </span>
      )}
    </div>
  );
}
