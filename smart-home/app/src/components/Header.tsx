import { useHass, type ConnStatus } from '../ha/HassProvider';

const LABEL: Record<ConnStatus, string> = {
  demo: 'Demo',
  connecting: 'Připojuji…',
  connected: 'Připojeno',
  error: 'Chyba spojení',
};

export function Header({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { status } = useHass();

  return (
    <header className="header">
      <div className="header__title">
        <span className="header__logo">⌂</span>
        <span>Domácnost</span>
      </div>
      <div className="header__right">
        <span className={`status status--${status}`}>
          <span className="status__dot" />
          {LABEL[status]}
        </span>
        <button className="icon-btn" onClick={onOpenSettings} aria-label="Nastavení">
          ⚙️
        </button>
      </div>
    </header>
  );
}
