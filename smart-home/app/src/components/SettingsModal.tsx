import { useState } from 'react';
import { useHass } from '../ha/HassProvider';

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { config, saveConfig, status, error } = useHass();
  const [hassUrl, setHassUrl] = useState(config.hassUrl);
  const [token, setToken] = useState(config.token);
  const [demo, setDemo] = useState(config.demo);

  const save = () => {
    saveConfig({ hassUrl: hassUrl.trim(), token: token.trim(), demo });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal__title">Připojení k Home Assistantu</h2>

        <label className="field field--check">
          <input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} />
          <span>Demo režim (bez HA, simulovaná data)</span>
        </label>

        <label className="field">
          <span>URL Home Assistantu</span>
          <input
            type="url"
            placeholder="https://ha.doma.lan"
            value={hassUrl}
            onChange={(e) => setHassUrl(e.target.value)}
            disabled={demo}
          />
        </label>

        <label className="field">
          <span>Long-Lived Access Token</span>
          <input
            type="password"
            placeholder="HA → profil → dole"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            disabled={demo}
          />
        </label>

        {status === 'error' && error && <p className="field__error">Chyba: {error}</p>}

        <p className="modal__hint">
          Pozor na mixed-content: appka přes https:// musí volat HA také přes https://
          (reverzní proxy s TLS). Viz dokument 08, sekce 8.6.
        </p>

        <div className="modal__actions">
          <button className="btn btn--ghost" onClick={onClose}>
            Zrušit
          </button>
          <button className="btn btn--primary" onClick={save}>
            Uložit
          </button>
        </div>
      </div>
    </div>
  );
}
