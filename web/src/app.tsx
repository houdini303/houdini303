import { useQuery } from '@tanstack/react-query';
import { fetchVehicles } from './api.ts';
import { MapView } from './map/MapView.tsx';

// Fáze 2: fullscreen mapa Pardubic jako hlavní plocha. Nad ní plave LIVE pill
// s počtem vozů (živě z /api/vehicles). Markery vozů přijdou ve Fázi 3,
// bottom sheet ve Fázi 4.
export function App() {
  const { data, isError } = useQuery({
    queryKey: ['vehicles'],
    queryFn: fetchVehicles,
    refetchInterval: 12_000,
  });

  return (
    <>
      <MapView />
      <LivePill count={data?.count} error={isError} />
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
