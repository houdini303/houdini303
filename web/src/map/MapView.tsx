import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef, useState } from 'react';
import { CITY_ZOOM, INITIAL_ZOOM, PARDUBICE_CENTER } from './pardubice.ts';
import { add3dBuildings, DARK_STYLE_URL, tunePalette } from './style.ts';

interface MapViewProps {
  onReady?: (map: maplibregl.Map) => void;
}

// Fáze 2: prémiová fullscreen mapová skořápka.
// - tmavý OpenFreeMap styl doladěný do naší palety + 3D budovy
// - intro fly-in s náklonem (pitch) → „premium" pocit
// - geolokace uživatele + recenter FAB
export function MapView({ onReady }: MapViewProps) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const geolocateRef = useRef<maplibregl.GeolocateControl | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!container.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: container.current,
      style: DARK_STYLE_URL,
      center: PARDUBICE_CENTER,
      zoom: INITIAL_ZOOM - 1.2, // start odzoomovaný → fly-in dovnitř
      pitch: 0,
      bearing: 0,
      attributionControl: false,
      dragRotate: true,
      maxZoom: 18,
      minZoom: 10,
    });
    mapRef.current = map;

    // decentní attribution (nezakrývá UI)
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-left',
    );

    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
    });
    geolocateRef.current = geolocate;
    map.addControl(geolocate, 'bottom-right'); // skryjeme přes CSS, ovládáme vlastním FAB

    map.on('load', () => {
      tunePalette(map);
      add3dBuildings(map);
      setReady(true);
      onReady?.(map);

      // Intro fly-in: plynulý spring-like přílet s náklonem.
      map.easeTo({
        center: PARDUBICE_CENTER,
        zoom: CITY_ZOOM,
        pitch: 45,
        bearing: -17,
        duration: 2600,
        easing: (t) => 1 - Math.pow(1 - t, 3), // easeOutCubic
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recenter = () => {
    // spustí geolokaci; když polohu nemáme, vrátí kameru na Pardubice
    geolocateRef.current?.trigger();
    mapRef.current?.easeTo({
      center: PARDUBICE_CENTER,
      zoom: CITY_ZOOM,
      pitch: 45,
      bearing: -17,
      duration: 1200,
    });
  };

  const resetNorth = () => mapRef.current?.easeTo({ bearing: 0, pitch: 0, duration: 700 });

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div ref={container} style={{ position: 'absolute', inset: 0 }} />

      {/* jemný vinětační přechod nahoře/dole pro čitelnost overlaye */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'linear-gradient(180deg, rgba(10,14,22,0.55) 0%, rgba(10,14,22,0) 18%, rgba(10,14,22,0) 72%, rgba(10,14,22,0.6) 100%)',
        }}
      />

      {/* Floating ovládání vpravo (nad budoucím bottom sheetem) */}
      <div
        style={{
          position: 'absolute',
          right: 'calc(env(safe-area-inset-right) + 14px)',
          bottom: 'calc(env(safe-area-inset-bottom) + 196px)', // nad peek sheetem
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          zIndex: 5,
        }}
      >
        <Fab label="Srovnat na sever" onClick={resetNorth}>
          ⌖
        </Fab>
        <Fab label="Moje poloha" onClick={recenter} accent>
          ◎
        </Fab>
      </div>

      {!ready && <MapLoading />}
    </div>
  );
}

function Fab({
  children,
  onClick,
  label,
  accent,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        width: 48,
        height: 48,
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.08)',
        background: accent ? 'var(--accent)' : 'rgba(20,26,38,0.82)',
        color: accent ? '#04101f' : 'var(--text)',
        fontSize: 22,
        cursor: 'pointer',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      {children}
    </button>
  );
}

function MapLoading() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        background: 'var(--bg)',
        zIndex: 10,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <img
          src="/icon.svg"
          width={56}
          height={56}
          style={{ animation: 'pulse 1.4s ease-in-out infinite' }}
          alt=""
        />
        <p style={{ color: 'var(--muted)', marginTop: 12, fontSize: 13 }}>
          Načítám mapu Pardubic…
        </p>
      </div>
    </div>
  );
}
