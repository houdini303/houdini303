# Houdini303 — živá mapa pardubické MHD

PWA (Uber/Bolt style) pro sledování aktuální polohy vozů pardubické městské
hromadné dopravy v reálném čase.

## Stav projektu

Fáze **analýza & plán dokončena**, stack potvrzen. Datové zdroje ověřené a
funkční, UX vzor a architektura navržené. **Další krok: Fáze 0+1 buildu**
(scaffold + proxy s reálnými daty). Viz [`docs/03`](docs/03-architecture-and-plan.md).

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

> Zatím není co spustit — čeká se na build (viz plán).
