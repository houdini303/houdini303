# Architektura & plán buildu

Návrh technického řešení a rozfázovaný plán stavby PWA pro živé sledování
pardubické MHD ve stylu Uber/Bolt.

---

## 1. Architektura (high-level)

```
┌────────────────────────────┐        ┌─────────────────────────┐        ┌────────────────────┐
│  PWA  (browser / mobil)    │  HTTPS │  PROXY  (serverless)    │  POST  │  online.dpmp.cz    │
│  React + MapLibre GL       │ ─────▶ │  /api/vehicles          │ ─────▶ │  api/lines         │
│  bottom sheet, live vozy   │  CORS  │  /api/lines             │ key +  │  api/currentConn…  │
│                            │ ◀───── │  cache 5–10 s, normaliz.│ t/plain│  api/codes         │
└────────────────────────────┘  JSON  └─────────────────────────┘        └────────────────────┘
```

### Proč proxy (povinná)

API DPMP **nevrací CORS hlavičky** → prohlížeč přímé volání blokuje. Proxy navíc:

1. **Skrývá klíč** (není v klientském bundlu).
2. **Přidá CORS** hlavičky pro náš frontend.
3. **Cachuje** odpovědi (5–10 s) → nehamruje DPMP a je to rychlé.
4. **Agreguje** všech 33 linek do jednoho volání `/api/vehicles` (paralelně).
5. **Normalizuje** data do čistého modelu + opraví kódování.

### Normalizovaný datový model

```ts
interface Vehicle {
  id: string;              // vid
  line: string;            // "2"
  destination: string;     // "Pardubičky,točna"
  lat: number;
  lon: number;
  delaySec: number | null; // z "time_difference" (00:00:52 → 52)
  currentStop: string;
  nextStop?: string;
  timestampUtc: string;    // state_dtime
}

interface Line { number: number; stops: Stop[]; color: string; }
interface Stop { number: number; name: string; lat?: number; lon?: number; }
```

`delaySec` je hero hodnota v UI (barevné odlišení). `nextStop` se dopočítá
z `connection.stops` + `current_stop_number`.

---

## 2. Tech stack

| Vrstva | Volba | Proč |
|---|---|---|
| Build | **Vite + React + TypeScript** | Rychlé, skvělá PWA podpora |
| Mapa | **MapLibre GL JS** | Zdarma, vektorové dlaždice, plynulá animace markerů, rotace, tmavé styly |
| Dlaždice | **OpenFreeMap** (styl *dark/liberty*) | Zdarma, **bez API klíče** (splňuje keyless požadavek) |
| Animace | **Framer Motion** | Spring přechody, bottom sheet, mikrointerakce |
| Bottom sheet | vlastní nad Framer Motion (nebo `react-modal-sheet`) | Uber-style snap pointy a gesta |
| Data fetching | **TanStack Query** | Polling (`refetchInterval`), cache, retry, skeleton stavy |
| Proxy | **Hono** (na Verc> Cloudflare Workers / Node) | Lehké, přenositelné, edge-ready |
| PWA | **vite-plugin-pwa** (Workbox) | Manifest, service worker, offline shell, instalace |
| Deploy | Vercel / Cloudflare (frontend + proxy) | Free tier, jednoduché |

> Vše volitelné bez placených klíčů. Jediný „klíč" je zadrátovaný DPMP klíč
> uvnitř proxy (na serveru, ne v klientu).

---

## 3. Struktura repozitáře (cílová)

```
houdini303/
├─ docs/                     # tato dokumentace
├─ data/
│  └─ pardubice_stops.csv    # statické zastávky (záloha / shapes)
├─ proxy/                    # serverless proxy (Hono)
│  └─ src/
│     ├─ index.ts            # routy /api/vehicles, /api/lines
│     ├─ dpmp.ts             # klient DPMP (key, text/plain, cache)
│     └─ normalize.ts        # mapování na Vehicle/Line model
├─ web/                      # PWA frontend (Vite + React)
│  ├─ src/
│  │  ├─ map/                # MapLibre setup, styly, marker vrstva
│  │  ├─ vehicles/           # polling, interpolace, heading
│  │  ├─ sheet/              # bottom sheet + snap pointy
│  │  ├─ views/              # detail vozu / zastávky / linky, search
│  │  ├─ ui/                 # design tokens, karty, skeletony
│  │  └─ app.tsx
│  ├─ public/                # ikony, manifest
│  └─ vite.config.ts
└─ README.md
```

(Proxy a web lze držet i v jednom projektu — finální rozdělení doladíme na
začátku buildu podle deploy cíle.)

---

## 4. Plán po fázích

Každá fáze je samostatně ověřitelná (něco jde spustit / vidět).

### Fáze 0 — Scaffold
- Inicializace `web/` (Vite React TS) + `proxy/` (Hono).
- PWA manifest, ikony placeholder, safe-area layout.
- **Výstup:** prázdná fullscreen appka se spustí.

### Fáze 1 — Proxy s reálnými daty ⭐ (odemyká vše)
- Klient DPMP (key + `text/plain`, správné kódování).
- `/api/lines` (cache) a `/api/vehicles` (iterace 33 linek paralelně, cache 8 s).
- Normalizace na `Vehicle[]`.
- **Výstup:** `GET /api/vehicles` vrací živý seznam vozů s GPS + CORS.

### Fáze 2 — Mapová skořápka
- Fullscreen MapLibre, tmavý styl (OpenFreeMap), centrováno na Pardubice.
- Recenter na polohu uživatele, safe-area, přepínač light/dark.
- **Výstup:** hezká živá mapa Pardubic.

### Fáze 3 — Živé vozy ⭐ (největší „wow")
- Marker vrstva z `/api/vehicles`, polling každých 10–15 s (TanStack Query).
- **Plynulá interpolace** polohy mezi aktualizacemi.
- **Natočení** ikony dle vypočteného azimutu; barva dle linky; badge s číslem.
- **Výstup:** vozy jezdí po mapě plynule jako v Uberu.

### Fáze 4 — Bottom sheet + seznamy
- Snap pointy (peek/half/full), gesta, spring.
- Peek: search „linka/zastávka" + počet vozů. Half: seznam linek / nejbližší
  zastávky. Našeptávač.
- **Výstup:** ovládání a navigace nad mapou.

### Fáze 5 — Detailové pohledy
- **Detail vozu:** zpoždění jako hero (barevně), aktuální/příští zastávka,
  zbývající zastávky s časy.
- **Detail zastávky:** tabule odjezdů „za X min".
- **Detail linky:** trasa + živé vozy na lince, fly-to.
- **Výstup:** plná informační hodnota.

### Fáze 6 — Polish
- Framer Motion přechody, skeletony místo spinnerů, „live" pulz.
- PWA: service worker, offline shell, instalovatelnost, splash, ikony.
- Ladění tmavého map stylu a design tokenů do Uber/Bolt kvality.
- **Výstup:** appka působí nativně a „premium".

### Fáze 7 — Deploy
- Nasazení frontendu + proxy (Vercel/Cloudflare), env pro klíč.
- Doladění cache/rate-limit, README s návodem.
- **Výstup:** veřejná URL, instalovatelná na mobil.

---

## 5. Rizika & mitigace

| Riziko | Mitigace |
|---|---|
| DPMP rotuje/zablokuje klíč | Proxy izoluje závislost; snadná výměna klíče; případně požádat DPMP o oficiální |
| Rate limiting z DPMP | Cache v proxy (8–10 s), jeden agregační refresh pro všechny klienty |
| Nepřesná interpolace (vozy „skáčou") | Interpolace po čase + tolerance; skryté vozy bez `bus` |
| Kódování názvů | Normalizace v proxy (UTF-8 / windows-1250 fallback) |
| Chybějící azimut | Výpočet z historie 2 poloh na klientu |

---

## 6. Doporučené pořadí do buildu

Fáze **0 → 1 → 2 → 3** dá funkční „živou mapu vozů" (MVP jádro, to nejlepší).
Fáze **4 → 5 → 6** přidá Uber/Bolt UX a detaily. Fáze **7** nasadí.

Navrhuji začít **Fází 0 + 1** (scaffold + proxy s reálnými daty), protože Fáze 1
odemyká vše ostatní.
