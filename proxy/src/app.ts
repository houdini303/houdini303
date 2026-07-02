import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { fetchConnections, fetchLines } from './dpmp.js';
import { normalizeLine, normalizeVehicle } from './normalize.js';
import type { Vehicle } from './types.js';

export const app = new Hono();

app.use('/api/*', cors()); // frontend na jiné doméně → povolíme CORS

app.get('/', (c) =>
  c.json({
    ok: true,
    service: 'houdini303-proxy',
    endpoints: ['/api/lines', '/api/vehicles'],
  }),
);

app.get('/api/lines', async (c) => {
  try {
    const raw = await fetchLines();
    const lines = raw.map(normalizeLine).sort((a, b) => a.number - b.number);
    return c.json(lines);
  } catch (err) {
    return c.json({ error: String(err) }, 502);
  }
});

// Agregace: /api/lines → čísla linek → currentConnections per linka (paralelně)
// → normalizace na Vehicle[]. Cache 8 s je uvnitř dpmp klienta.
app.get('/api/vehicles', async (c) => {
  try {
    const lines = await fetchLines();
    const results = await Promise.allSettled(
      lines.map((l) => fetchConnections(l.number)),
    );

    const vehicles: Vehicle[] = [];
    const seen = new Set<string>();
    for (const r of results) {
      if (r.status !== 'fulfilled') continue;
      for (const conn of r.value) {
        const v = normalizeVehicle(conn);
        if (v && !seen.has(v.id)) {
          seen.add(v.id);
          vehicles.push(v);
        }
      }
    }

    const failed = results.filter((r) => r.status === 'rejected').length;
    return c.json({
      updatedAt: new Date().toISOString(),
      count: vehicles.length,
      linesFailed: failed,
      vehicles,
    });
  } catch (err) {
    return c.json({ error: String(err) }, 502);
  }
});
