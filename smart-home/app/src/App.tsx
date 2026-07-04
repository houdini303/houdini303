import { useState } from 'react';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { SceneRow } from './components/SceneRow';
import { CoffeeCard } from './components/CoffeeCard';
import { RoomSection } from './components/RoomSection';
import { ROOMS } from './rooms';

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="app">
      <Header onOpenSettings={() => setSettingsOpen(true)} />

      <main className="main">
        <section className="block">
          <h1 className="block__title">Scény</h1>
          <SceneRow />
        </section>

        <section className="block">
          <h1 className="block__title">Kávovar</h1>
          <CoffeeCard />
        </section>

        <section className="block">
          <h1 className="block__title">Světla</h1>
          <div className="rooms">
            {ROOMS.map((room) => (
              <RoomSection key={room.id} room={room} />
            ))}
          </div>
        </section>
      </main>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
