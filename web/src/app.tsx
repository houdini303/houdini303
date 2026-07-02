import { useQuery } from '@tanstack/react-query';
import { fetchVehicles } from './api.ts';

// Fáze 0: prázdná fullscreen skořápka, která se spustí. Jako živý důkaz
// propojení s proxy (Fáze 1) pingne /api/vehicles a ukáže počet vozů.
// Mapa (MapLibre) přijde ve Fázi 2, živé markery ve Fázi 3.
export function App() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['vehicles'],
    queryFn: fetchVehicles,
    refetchInterval: 12_000,
  });

  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        textAlign: 'center',
        padding: 24,
      }}
    >
      <img src="/icon.svg" alt="" width={72} height={72} />
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>MHD Pardubice živě</h1>
        <p style={{ color: 'var(--muted)', marginTop: 4, fontSize: 14 }}>
          Fáze 0 — skořápka běží. Mapa přijde ve Fázi 2.
        </p>
      </div>

      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 16,
          padding: '16px 24px',
          minWidth: 220,
        }}
      >
        {isLoading && <span style={{ color: 'var(--muted)' }}>Načítám vozy…</span>}
        {isError && (
          <span style={{ color: 'var(--err)' }}>
            Proxy neběží? {String((error as Error)?.message ?? error)}
          </span>
        )}
        {data && (
          <>
            <div style={{ fontSize: 40, fontWeight: 800, color: 'var(--accent)' }}>
              {data.count}
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>
              vozů právě v provozu
              {data.linesFailed > 0 && ` · ${data.linesFailed} linek selhalo`}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
