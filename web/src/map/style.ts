import type { Map as MlMap } from 'maplibre-gl';

// OpenFreeMap tmavý styl (zdarma, bez klíče). Doladíme ho do naší palety
// (hlubší modročerná à la Uber) a přidáme 3D budovy pro „premium" hloubku.
export const DARK_STYLE_URL = 'https://tiles.openfreemap.org/styles/dark';

// Naše paleta (sladěno s index.css tokeny).
const C = {
  bg: '#0a0e16',
  water: '#0d2438',
  park: '#0f2018',
  roadMinor: '#212a3a',
  roadMajor: '#38455f',
  roadMotorway: '#4a5f86',
  roadCasing: '#0f1622',
  rail: '#242d3d',
  building: '#141b28',
  buildingTop: '#212c40',
};

// Bezpečně přebarví existující vrstvu (ignoruje chybějící).
function paint(map: MlMap, id: string, prop: string, value: unknown): void {
  if (map.getLayer(id)) {
    try {
      map.setPaintProperty(id, prop as never, value as never);
    } catch {
      /* vrstva nemá tuto vlastnost — ignoruj */
    }
  }
}

// Doladí barvy hlavních vrstev po načtení stylu.
export function tunePalette(map: MlMap): void {
  paint(map, 'background', 'background-color', C.bg);
  paint(map, 'water', 'fill-color', C.water);
  paint(map, 'waterway', 'line-color', C.water);
  paint(map, 'landcover_wood', 'fill-color', C.park);
  paint(map, 'landuse_park', 'fill-color', C.park);
  paint(map, 'building', 'fill-color', C.building);

  // Silniční hierarchie — viditelná, ale tlumená (Uber-dark), ať vyniknou vozy.
  // (ID vrstev ověřena proti OpenFreeMap dark stylu.)
  paint(map, 'highway_path', 'line-color', C.roadMinor);
  paint(map, 'highway_minor', 'line-color', C.roadMinor);
  paint(map, 'highway_major_subtle', 'line-color', C.roadMajor);
  paint(map, 'highway_major_inner', 'line-color', C.roadMajor);
  paint(map, 'highway_major_casing', 'line-color', C.roadCasing);
  paint(map, 'highway_motorway_subtle', 'line-color', C.roadMotorway);
  paint(map, 'highway_motorway_inner', 'line-color', C.roadMotorway);
  paint(map, 'highway_motorway_casing', 'line-color', C.roadCasing);

  for (const id of ['railway', 'railway_minor', 'railway_transit']) {
    paint(map, id, 'line-color', C.rail);
  }
}

// Přidá 3D extruzi budov (jemná, desaturovaná) — přepíná se dle pitch.
export function add3dBuildings(map: MlMap): void {
  if (map.getLayer('buildings-3d')) return;
  const style = map.getStyle();
  const hasBuildingSrc = style.layers?.some((l) => l.id === 'building');
  if (!hasBuildingSrc) return;

  // vlož před popisky (symboly), ať budovy nezakrývají texty
  const firstSymbol = style.layers?.find((l) => l.type === 'symbol')?.id;

  map.addLayer(
    {
      id: 'buildings-3d',
      type: 'fill-extrusion',
      source: 'openmaptiles',
      'source-layer': 'building',
      minzoom: 14,
      paint: {
        'fill-extrusion-color': [
          'interpolate',
          ['linear'],
          ['get', 'render_height'],
          0,
          C.building,
          60,
          C.buildingTop,
        ],
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          14,
          0,
          15.5,
          ['coalesce', ['get', 'render_height'], 6],
        ],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': 0.85,
      },
    },
    firstSymbol,
  );
}
