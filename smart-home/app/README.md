# Domácnost — vlastní PWA pro Home Assistant

Vlastní ovládací aplikace chytré domácnosti (React + TS + Vite + PWA). Mluví s
**Home Assistantem** přes jeho lokální **WebSocket/REST API** (varianta V1 z
[`../08-vlastni-aplikace.md`](../08-vlastni-aplikace.md)). Jeden kód → nástěnný
iPad (na šířku) i mobil (na výšku) i desktop.

## Rychlý start

```bash
cd smart-home/app
npm install
npm run dev
```

Otevře se v **demo režimu** (simulovaná zařízení, bez HA) — hned uvidíš UI a
můžeš klikat. Světla, jas, barvy, scény i „Vše vypnout" reagují na fiktivních
datech.

## Připojení k reálnému Home Assistantu

1. V HA si vytvoř **Long-Lived Access Token**: profil (dole) → *Long-Lived
   Access Tokens* → *Create Token*.
2. V appce klikni na ⚙️ (vpravo nahoře), **vypni demo**, zadej **URL HA**
   (např. `https://ha.doma.lan`) a **token**. Uloží se do prohlížeče.
   - Alternativně přes `.env` (viz [`.env.example`](.env.example)).
3. Stav připojení uvidíš v hlavičce (Demo / Připojuji… / Připojeno / Chyba).

> ⚠️ **Mixed-content (iOS):** appka běžící přes `https://` **nesmí** volat HA přes
> `http://`. Měj HA za reverzní proxy s TLS (`https://ha.doma.lan`). Detaily:
> [`../08-vlastni-aplikace.md`](../08-vlastni-aplikace.md), sekce 8.6.

## Přizpůsobení tvým zařízením

Jediné místo k úpravě je [`src/rooms.ts`](src/rooms.ts) — mapování místností,
světel, scén a kávovaru na tvoje skutečné `entity_id` a `script`/`scene` z HA.
Backend (scény, script pulzu kávovaru) definuješ v HA dle dokumentů
[`../03`](../03-kavovar-jura.md) a [`../05`](../05-automatizace-sceny.md).

## Struktura

```
src/
├── main.tsx                 vstupní bod, obalí appku HassProvider
├── App.tsx                  layout: Scény · Kávovar · Světla
├── config.ts                načtení/uložení připojení (localStorage/.env)
├── rooms.ts                 ⬅ ZDE mapuješ své entity, scény, kávovar
├── ha/
│   ├── types.ts             sjednotné rozhraní HaClient
│   ├── realClient.ts        reálné HA (home-assistant-js-websocket)
│   ├── mockClient.ts        demo režim (simulace)
│   └── HassProvider.tsx     React kontext: stav entit + volání služeb
├── lib/light.ts             pomocné funkce nad světly (jas, barva, podpora režimů)
└── components/              Header, SettingsModal, SceneRow, CoffeeCard, RoomSection, LightCard
```

## Build / kiosk

```bash
npm run build     # tsc + vite build → dist/
npm run preview   # lokální náhled produkčního buildu
```

Na iPad: otevři appku v Safari → *Sdílet* → *Přidat na plochu*, spusť
z ikony (fullscreen PWA) a zamkni přes **Guided Access** (kiosk). Viz
[`../04-dashboard-ipad.md`](../04-dashboard-ipad.md) a
[`../06-postup-instalace.md`](../06-postup-instalace.md).

## Stav

Scaffold (Fáze 1–4 z plánu): připojení na HA + demo, karty světel (zap/vyp, jas,
RGB/teplota bílé), místnosti s master přepínačem, tlačítko kávovaru, scény.
Další na řadě: TLS proxy + instalace na iPad (Fáze 5).
