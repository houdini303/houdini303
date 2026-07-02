# Houdini303 — živá mapa pardubické MHD

PWA (Uber/Bolt style) pro sledování aktuální polohy vozů pardubické městské
hromadné dopravy v reálném čase.

## Stav projektu

Analýza & plán dokončeny, stack potvrzen. **Fáze 0 (scaffold) a Fáze 1 (proxy
s reálnými daty) hotové a ověřené** — `web/` PWA skořápka běží, `proxy/` servíruje
živý `/api/vehicles` s GPS vozů a CORS. **Další krok: Fáze 2** (mapová skořápka
MapLibre). Viz [`docs/03`](docs/03-architecture-and-plan.md).

## Potvrzený stack

Vite + React + TypeScript · MapLibre GL + OpenFreeMap (bez klíče) ·
Framer Motion · TanStack Query · Hono proxy · vite-plugin-pwa

## Co umíme získat

- **Real-time polohy vozů** (GPS, číslo linky, cíl, aktuální/příští zastávka,
  zpoždění) — živý feed DPMP, ověřeno funkční.
- **Statická data** (zastávky + souřadnice, jízdní řády linek) — z GTFS.

## Dokumentace

| Dokument | Obsah |
|---|---|
| [`docs/01-data-sources.md`](docs/01-data-sources.md) | Datové zdroje, API DPMP, schémata, CORS, právní kontext |
| [`docs/02-uber-bolt-analysis.md`](docs/02-uber-bolt-analysis.md) | Analýza UX/UI vzorů Uber & Bolt a jejich převedení na MHD |
| [`docs/03-architecture-and-plan.md`](docs/03-architecture-and-plan.md) | Architektura, tech stack, plán buildu po fázích |

## Rychlý start (dev)

Dva procesy — proxy (živá data) a web (PWA). Ve dvou terminálech:

```bash
# 1) proxy → http://localhost:8787
cd proxy && npm install && npm run dev

# 2) web → http://localhost:5173  (dev proxy /api → 8787)
cd web && npm install && npm run dev
```

Otevři <http://localhost:5173> — appka ukáže počet vozů právě v provozu
(živý ping na `/api/vehicles`). Detaily viz [`proxy/README.md`](proxy/README.md).
