import { useHass } from '../ha/HassProvider';
import type { RoomDef } from '../rooms';
import { isOn } from '../lib/light';
import { LightCard } from './LightCard';

export function RoomSection({ room }: { room: RoomDef }) {
  const { entities, callService } = useHass();

  const ids = room.lights.map((l) => l.entity_id);
  const anyOn = ids.some((id) => isOn(entities[id]));

  // Master přepínač místnosti — jedním voláním na všechny entity zóny.
  const toggleAll = () =>
    callService('light', anyOn ? 'turn_off' : 'turn_on', undefined, { entity_id: ids });

  return (
    <section className="room">
      <div className="room__head">
        <h2 className="room__title">{room.name}</h2>
        <button
          className={`room__master ${anyOn ? 'is-on' : ''}`}
          onClick={toggleAll}
          aria-pressed={anyOn}
        >
          {anyOn ? 'Vypnout vše' : 'Zapnout vše'}
        </button>
      </div>
      <div className="room__lights">
        {room.lights.map((l) => (
          <LightCard key={l.entity_id} def={l} />
        ))}
      </div>
    </section>
  );
}
