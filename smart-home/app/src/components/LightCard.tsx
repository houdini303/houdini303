import { useHass } from '../ha/HassProvider';
import type { LightDef } from '../rooms';
import {
  brightnessPct,
  CT_PRESETS,
  cssColor,
  isOn,
  RGB_PRESETS,
  supportsBrightness,
  supportsColorTemp,
  supportsRgb,
} from '../lib/light';

export function LightCard({ def }: { def: LightDef }) {
  const { entities, callService } = useHass();
  const entity = entities[def.entity_id];

  // Entita, kterou HA (zatím) nezná — ukaž náznak, ať víš, že chybí mapování.
  if (!entity) {
    return (
      <div className="card light-card light-card--missing">
        <div className="light-card__head">
          <span className="light-card__name">{def.name}</span>
        </div>
        <span className="light-card__hint">entita „{def.entity_id}" není v HA</span>
      </div>
    );
  }

  const on = isOn(entity);
  const pct = brightnessPct(entity);

  const toggle = () =>
    callService('light', on ? 'turn_off' : 'turn_on', undefined, { entity_id: def.entity_id });

  const setBrightness = (value: number) =>
    callService('light', 'turn_on', { brightness_pct: value }, { entity_id: def.entity_id });

  const setRgb = (rgb: [number, number, number]) =>
    callService('light', 'turn_on', { rgb_color: rgb }, { entity_id: def.entity_id });

  const setKelvin = (kelvin: number) =>
    callService('light', 'turn_on', { color_temp_kelvin: kelvin }, { entity_id: def.entity_id });

  return (
    <div className={`card light-card ${on ? 'is-on' : ''}`}>
      <button className="light-card__head" onClick={toggle} aria-pressed={on}>
        <span
          className="light-card__dot"
          style={{ background: on ? cssColor(entity) : 'transparent' }}
        />
        <span className="light-card__name">{def.name}</span>
        <span className="light-card__state">{on ? `${pct} %` : 'Vyp'}</span>
      </button>

      {on && supportsBrightness(entity) && (
        <input
          className="slider"
          type="range"
          min={1}
          max={100}
          value={pct}
          onChange={(e) => setBrightness(Number(e.target.value))}
          aria-label="Jas"
        />
      )}

      {on && supportsRgb(entity) && (
        <div className="swatches">
          {RGB_PRESETS.map((p) => (
            <button
              key={p.name}
              className="swatch"
              title={p.name}
              style={{ background: `rgb(${p.rgb.join(',')})` }}
              onClick={() => setRgb(p.rgb)}
            />
          ))}
        </div>
      )}

      {on && supportsColorTemp(entity) && (
        <div className="ct-row">
          {CT_PRESETS.map((p) => (
            <button key={p.name} className="ct-btn" onClick={() => setKelvin(p.kelvin)}>
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
