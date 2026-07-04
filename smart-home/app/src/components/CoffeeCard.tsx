import { useState } from 'react';
import { useHass } from '../ha/HassProvider';
import { COFFEE } from '../rooms';

export function CoffeeCard() {
  const { callService } = useHass();
  const [busy, setBusy] = useState(false);

  const brew = async () => {
    if (busy) return;
    setBusy(true);
    await callService(COFFEE.call.domain, COFFEE.call.service);
    // Krátká vizuální odezva "spouštím" (relé pošle pulz — viz 03-kavovar-jura.md).
    setTimeout(() => setBusy(false), 3000);
  };

  return (
    <button className={`card coffee ${busy ? 'is-busy' : ''}`} onClick={brew} disabled={busy}>
      <span className="coffee__icon">☕</span>
      <span className="coffee__label">{busy ? 'Spouštím…' : COFFEE.name}</span>
    </button>
  );
}
