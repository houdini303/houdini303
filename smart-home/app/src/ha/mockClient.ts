import type { HaClient, HaEntities, HaEntity, ServiceTarget } from './types';

// Demo klient — simuluje Home Assistant bez připojení k reálnému HA.
// Slouží k okamžitému vyzkoušení UI (`npm run dev`) a jako "hřiště" pro vývoj karet.
// Chování služeb (light.turn_on/off, scény, script.vse_vypnout) mění lokální stav
// a hlásí ho zpět, takže appka reaguje jako proti živému systému.

function mk(entity_id: string, state: string, attributes: Record<string, unknown>): HaEntity {
  return { entity_id, state, attributes };
}

function seed(): HaEntities {
  return {
    'light.obyvak_pasek': mk('on', 'on', {
      friendly_name: 'LED pásek',
      brightness: 170,
      rgb_color: [255, 140, 40],
      color_mode: 'rgb',
      supported_color_modes: ['rgb', 'brightness'],
    }),
    'light.obyvak_hlavni': mk('light.obyvak_hlavni', 'off', {
      friendly_name: 'Hlavní světlo',
      supported_color_modes: ['brightness'],
    }),
    'light.kuchyn_strop': mk('light.kuchyn_strop', 'on', {
      friendly_name: 'Strop',
      brightness: 220,
      supported_color_modes: ['brightness'],
    }),
    'light.loznice_zarovka': mk('light.loznice_zarovka', 'on', {
      friendly_name: 'Žárovka',
      brightness: 120,
      color_temp_kelvin: 2700,
      color_mode: 'color_temp',
      supported_color_modes: ['color_temp'],
    }),
    'light.loznice_nocni': mk('light.loznice_nocni', 'off', {
      friendly_name: 'Noční',
      supported_color_modes: ['brightness'],
    }),
  };
}

function asList(target?: ServiceTarget): string[] {
  if (!target?.entity_id) return [];
  return Array.isArray(target.entity_id) ? target.entity_id : [target.entity_id];
}

export function createMockClient(): HaClient {
  let entities = seed();
  const listeners = new Set<(e: HaEntities) => void>();

  const emit = () => {
    const snapshot = { ...entities };
    listeners.forEach((cb) => cb(snapshot));
  };

  const patch = (id: string, state: string, attrs: Record<string, unknown> = {}) => {
    const prev = entities[id];
    if (!prev) return;
    entities = {
      ...entities,
      [id]: { ...prev, state, attributes: { ...prev.attributes, ...attrs } },
    };
  };

  const turnOn = (id: string, data: Record<string, unknown>) => {
    const attrs: Record<string, unknown> = {};
    if (typeof data.brightness_pct === 'number') {
      attrs.brightness = Math.round((data.brightness_pct as number) * 2.55);
    }
    if (data.rgb_color) {
      attrs.rgb_color = data.rgb_color;
      attrs.color_mode = 'rgb';
    }
    if (typeof data.color_temp_kelvin === 'number') {
      attrs.color_temp_kelvin = data.color_temp_kelvin;
      attrs.color_mode = 'color_temp';
    }
    patch(id, 'on', attrs);
  };

  return {
    subscribe(cb) {
      listeners.add(cb);
      // Prvotní snapshot hned po přihlášení.
      cb({ ...entities });
      return () => listeners.delete(cb);
    },

    async callService(domain, service, data = {}, target) {
      const ids = asList(target);

      if (domain === 'light') {
        for (const id of ids) {
          if (service === 'turn_on') turnOn(id, data);
          else if (service === 'turn_off') patch(id, 'off');
          else if (service === 'toggle') patch(id, entities[id]?.state === 'on' ? 'off' : 'on', data);
        }
        emit();
        return;
      }

      if (domain === 'scene' && service === 'turn_on') {
        const scene = ids[0] ?? '';
        if (scene.endsWith('vecerni_relax')) {
          turnOn('light.obyvak_pasek', { brightness_pct: 25, rgb_color: [255, 140, 40] });
          patch('light.obyvak_hlavni', 'off');
          turnOn('light.loznice_nocni', { brightness_pct: 40 });
        } else if (scene.endsWith('rano')) {
          turnOn('light.kuchyn_strop', { brightness_pct: 90 });
          turnOn('light.obyvak_hlavni', { brightness_pct: 70 });
        }
        emit();
        return;
      }

      if (domain === 'script') {
        if (service === 'vse_vypnout') {
          Object.keys(entities).forEach((id) => {
            if (id.startsWith('light.')) patch(id, 'off');
          });
          emit();
        }
        // script.jura_spustit apod. jen "proběhne" — v demu není co simulovat.
        return;
      }
    },

    disconnect() {
      listeners.clear();
    },
  };
}
