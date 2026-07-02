# houdini303-proxy

Serverless proxy nad DPMP feedem (`online.dpmp.cz`). Skrývá klíč, přidává CORS,
cachuje a agreguje všech 33 linek do jednoho volání `/api/vehicles`.

## Dev

```bash
cd proxy
npm install
npm run dev        # http://localhost:8787
```

## Endpointy

| Endpoint | Vrací |
|---|---|
| `GET /api/lines` | Normalizované linky `Line[]` (číslo, zastávky, barva). Cache 1 h. |
| `GET /api/vehicles` | `{ updatedAt, count, linesFailed, vehicles: Vehicle[] }`. Cache 8 s. |

```jsonc
// Vehicle
{ "id":"492","line":"2","destination":"Pardubičky,točna",
  "lat":50.045765,"lon":15.76655,"delaySec":18,
  "currentStop":"Stavařov","nextStop":"…","timestampUtc":"2026-07-02 07:53:51.989" }
```

## Env

- `DPMP_KEY` — klíč k DPMP API (fallback na známou dev hodnotu je v `src/dpmp.ts`).
- `PORT` — port dev serveru (default `8787`).

## Poznámky

- DPMP odpovídá `200` jen s `Content-Type: text/plain;charset=UTF-8` (viz `docs/01`).
- Cache polohy 8 s = jeden sdílený refresh pro všechny klienty (rate-limit safe).
- Přenositelné na Vercel / Cloudflare Workers (`app.fetch`). Dev běží přes
  `@hono/node-server`.
