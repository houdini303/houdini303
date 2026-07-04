import { useHass } from '../ha/HassProvider';
import { SCENES } from '../rooms';

export function SceneRow() {
  const { callService } = useHass();

  const run = (domain: string, service: string, entity_id?: string) =>
    callService(domain, service, undefined, entity_id ? { entity_id } : undefined);

  return (
    <div className="scenes">
      {SCENES.map((s) => (
        <button
          key={s.id}
          className="scene"
          style={{ '--accent': s.accent } as React.CSSProperties}
          onClick={() => run(s.call.domain, s.call.service, s.call.entity_id)}
        >
          <span className="scene__icon">{s.icon}</span>
          <span className="scene__name">{s.name}</span>
        </button>
      ))}
    </div>
  );
}
