import { animate, motion, useDragControls, useMotionValue } from 'framer-motion';
import type maplibregl from 'maplibre-gl';
import { useEffect, useMemo, useState } from 'react';
import type { Line, Vehicle } from '../api.ts';
import { kindForLine, lineColor } from '../vehicles/color.ts';

type Snap = 'peek' | 'half' | 'full';
const PEEK_PX = 176; // kolik je vidět v collapsed stavu (grabber + search + count)

interface Props {
  map: maplibregl.Map;
  lines: Line[];
  vehicles: Vehicle[];
}

// Fáze 4: tažitelný bottom sheet (Uber/Bolt). Snap peek/half/full se spring
// animací a gesty. Peek = search + počet vozů; expanded = seznam linek s barvami,
// typem a počtem živých vozů; tap na linku → přiblížení na její vozy.
export function TransitSheet({ map, lines, vehicles }: Props) {
  const [vh, setVh] = useState(() => window.innerHeight);
  const [snap, setSnap] = useState<Snap>('peek');
  const [query, setQuery] = useState('');
  const dragControls = useDragControls();
  const y = useMotionValue(0);

  const sheetH = Math.round(vh * 0.9);
  const targets = useMemo<Record<Snap, number>>(
    () => ({
      full: 0,
      half: Math.round(sheetH - vh * 0.5),
      peek: sheetH - PEEK_PX,
    }),
    [sheetH, vh],
  );

  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // udrž pozici při změně snapu / rozměru
  useEffect(() => {
    const controls = animate(y, targets[snap], {
      type: 'spring',
      stiffness: 420,
      damping: 40,
    });
    return controls.stop;
  }, [snap, targets, y]);

  function onDragEnd(_e: unknown, info: { velocity: { y: number } }) {
    const cur = y.get();
    const projected = cur + info.velocity.y * 0.15;
    const order: Snap[] = ['full', 'half', 'peek'];
    let best: Snap = 'peek';
    let bestD = Infinity;
    for (const s of order) {
      const d = Math.abs(targets[s] - projected);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    setSnap(best);
  }

  // počet živých vozů na linku
  const countByLine = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of vehicles) m.set(v.line, (m.get(v.line) ?? 0) + 1);
    return m;
  }, [vehicles]);

  const q = query.trim().toLowerCase();
  const matchedLines = useMemo(() => {
    const arr = q ? lines.filter((l) => String(l.number).includes(q)) : lines;
    // řazení: nejdřív linky s vozy v provozu, pak podle čísla
    return [...arr].sort((a, b) => {
      const ca = countByLine.get(String(a.number)) ?? 0;
      const cb = countByLine.get(String(b.number)) ?? 0;
      if (!!cb !== !!ca) return cb - ca;
      return a.number - b.number;
    });
  }, [lines, q, countByLine]);

  const matchedStops = useMemo(() => {
    if (!q) return [];
    const names = new Set<string>();
    const out: { name: string; lineNums: number[] }[] = [];
    for (const l of lines) {
      for (const s of l.stops) {
        if (s.name.toLowerCase().includes(q) && !names.has(s.name)) {
          names.add(s.name);
          out.push({ name: s.name, lineNums: linesServing(lines, s.name) });
        }
      }
    }
    return out.slice(0, 20);
  }, [lines, q]);

  function selectLine(lineNumber: number) {
    const vs = vehicles.filter((v) => v.line === String(lineNumber));
    if (vs.length) {
      let minLng = 180,
        minLat = 90,
        maxLng = -180,
        maxLat = -90;
      for (const v of vs) {
        minLng = Math.min(minLng, v.lon);
        maxLng = Math.max(maxLng, v.lon);
        minLat = Math.min(minLat, v.lat);
        maxLat = Math.max(maxLat, v.lat);
      }
      map.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding: { top: 90, bottom: Math.round(vh * 0.45), left: 60, right: 60 }, maxZoom: 15.5, duration: 900 },
      );
    }
    setSnap('peek');
  }

  const totalVehicles = vehicles.length;

  return (
    <motion.div
      className="sheet"
      style={{ height: sheetH, y }}
      drag="y"
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ top: 0, bottom: targets.peek }}
      dragElastic={0.04}
      onDragEnd={onDragEnd}
    >
      {/* drag handle: grabber + počet (search NENÍ handle, ať jde napsat) */}
      <div
        className="sheet-handle"
        onPointerDown={(e) => dragControls.start(e)}
        style={{ touchAction: 'none' }}
      >
        <div className="sheet-grabber" />
        <div className="sheet-count">
          <span className="live-dot" />
          <strong>{totalVehicles}</strong> vozů živě · {lines.length} linek
        </div>
      </div>

      <div className="sheet-search">
        <span className="sheet-search-icon">⌕</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => snap === 'peek' && setSnap('half')}
          placeholder="Linka nebo zastávka…"
          inputMode="text"
        />
        {query && (
          <button className="sheet-clear" onClick={() => setQuery('')} aria-label="Vymazat">
            ✕
          </button>
        )}
      </div>

      <div className="sheet-body">
        <div className="sheet-section-title">
          {q ? 'Linky' : 'Všechny linky'} <span>{matchedLines.length}</span>
        </div>
        {matchedLines.map((l) => {
          const kind = kindForLine(l.number);
          const count = countByLine.get(String(l.number)) ?? 0;
          return (
            <button key={l.number} className="line-row" onClick={() => selectLine(l.number)}>
              <span className="line-badge" style={{ background: lineColor(l.number) }}>
                {l.number}
              </span>
              <span className="line-meta">
                <span className="line-name">Linka {l.number}</span>
                <span className="line-kind">{kind === 'trolleybus' ? 'Trolejbus' : 'Autobus'}</span>
              </span>
              <span className={count ? 'line-count line-count--live' : 'line-count'}>
                {count ? `${count} ${plural(count)}` : '—'}
              </span>
            </button>
          );
        })}

        {matchedStops.length > 0 && (
          <>
            <div className="sheet-section-title">
              Zastávky <span>{matchedStops.length}</span>
            </div>
            {matchedStops.map((s) => (
              <div key={s.name} className="stop-row">
                <span className="stop-pin">◍</span>
                <span className="stop-name">{s.name}</span>
                <span className="stop-lines">
                  {s.lineNums.slice(0, 6).map((n) => (
                    <span key={n} className="stop-line-dot" style={{ background: lineColor(n) }}>
                      {n}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </>
        )}
        <div style={{ height: 40 }} />
      </div>
    </motion.div>
  );
}

function linesServing(lines: Line[], stopName: string): number[] {
  const out: number[] = [];
  for (const l of lines) if (l.stops.some((s) => s.name === stopName)) out.push(l.number);
  return out.sort((a, b) => a - b);
}

function plural(n: number): string {
  if (n === 1) return 'vůz';
  if (n >= 2 && n <= 4) return 'vozy';
  return 'vozů';
}
