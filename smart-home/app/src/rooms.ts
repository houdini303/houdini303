// Mapování místností a scén na entity Home Assistantu.
// UPRAV entity_id podle svých skutečných názvů z HA (viz smart-home/02-osvetleni.md).
// Toto je jediné místo, které je potřeba přizpůsobit tvému konkrétnímu parku.

export interface LightDef {
  entity_id: string;
  name: string;
}

export interface RoomDef {
  id: string;
  name: string;
  lights: LightDef[];
}

export const ROOMS: RoomDef[] = [
  {
    id: 'obyvak',
    name: 'Obývák',
    lights: [
      { entity_id: 'light.obyvak_pasek', name: 'LED pásek' }, // Sonoff pásek 1001100b5d (RGB)
      { entity_id: 'light.obyvak_hlavni', name: 'Hlavní světlo' }, // IKEA
    ],
  },
  {
    id: 'kuchyn',
    name: 'Kuchyň',
    lights: [{ entity_id: 'light.kuchyn_strop', name: 'Strop' }],
  },
  {
    id: 'loznice',
    name: 'Ložnice',
    lights: [
      { entity_id: 'light.loznice_zarovka', name: 'Žárovka' }, // Sonoff B02-BL-A60 (laditelná bílá)
      { entity_id: 'light.loznice_nocni', name: 'Noční' },
    ],
  },
];

// Scény a "rychlé akce". call = jak se volá služba HA.
export interface SceneDef {
  id: string;
  name: string;
  icon: string;
  accent?: string;
  call: { domain: string; service: string; entity_id?: string };
}

export const SCENES: SceneDef[] = [
  {
    id: 'vse_vypnout',
    name: 'Vše vypnout',
    icon: '⭘',
    accent: '#ff5c5c',
    call: { domain: 'script', service: 'vse_vypnout' },
  },
  {
    id: 'vecerni_relax',
    name: 'Večerní relax',
    icon: '🌙',
    accent: '#b45cff',
    call: { domain: 'scene', service: 'turn_on', entity_id: 'scene.vecerni_relax' },
  },
  {
    id: 'rano',
    name: 'Ráno',
    icon: '☀️',
    accent: '#ffb347',
    call: { domain: 'scene', service: 'turn_on', entity_id: 'scene.rano' },
  },
];

// Kávovar Jura — pulzní script (viz smart-home/03-kavovar-jura.md).
export const COFFEE = {
  name: 'Uvařit kávu',
  call: { domain: 'script', service: 'jura_spustit' },
};
