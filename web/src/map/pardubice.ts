// Geo konstanty pro Pardubice (centrováno na hlavní nádraží / centrum).
export const PARDUBICE_CENTER: [number, number] = [15.7766, 50.0343];

// Volný bounding box města + okolí (pro omezení a fit).
export const PARDUBICE_BOUNDS: [[number, number], [number, number]] = [
  [15.68, 49.98], // SW
  [15.9, 50.09], // NE
];

export const INITIAL_ZOOM = 13.2;
export const CITY_ZOOM = 14.3;
