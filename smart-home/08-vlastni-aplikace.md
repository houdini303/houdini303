# 08 — Vlastní aplikace (PWA) místo Lovelace: architektonický plán

Cíl: **jedna vlastní appka** (PWA — Progressive Web App), kterou si nainstaluješ
na nástěnný iPad, mobil i desktop, a odkud manageuješ celou domácnost. Vlastní
UX, vlastní design, žádný Lovelace.

> **Poznámka k rozsahu:** **Tado je pro teď mimo hru** (viz [`07`](07-termostat-tado.md),
> odloženo). Tím se výrazně zjednodušuje architektura — viz níže. Aktuální park:
> Sonoff LED pásek (`1001100b5d`, Wi-Fi), Sonoff **B02-BL-A60** (Wi-Fi žárovka),
> **IKEA** Zigbee žárovky, **Jura + Shelly** relé, iPad kiosk.

---

## 8.1 Zásada, na které stojí celý projekt: dvě vrstvy

Chytrá domácnost = **(A) integrační engine** + **(B) UI**.

- **(A) Engine** = mluví se zařízeními (Zigbee párování, Sonoff eWeLink/LAN,
  Shelly, pulzní relé), drží stav, spouští scény a časové rutiny.
- **(B) UI** = to, co vidíš a mačkáš (tvoje PWA).

**Těžká a časově náročná část je engine, ne appka.** Appku (B) chceš vlastní tak
jako tak. Otázka „DIY vs. hotové" se tedy týká jen vrstvy (A).

Dobrá zpráva: **UI zůstává 100 % tvoje ve všech variantách.** Rozhodujeme jen,
jak moc enginu si napíšeš sám.

---

## 8.2 Tři možné architektury (bez Tada)

### Varianta 1 — Vlastní PWA + Home Assistant jako „neviditelný" backend ⭐ nejrychlejší

HA běží na hubu **headless** (nikdy neotevřeš jeho Lovelace). Tvoje PWA s ním
mluví přes jeho **WebSocket + REST API**.

```
 [iPad / mobil / desktop]           [ HUB ]
  ┌───────────────────┐        ┌───────────────────────────────┐
  │  Tvoje PWA (React) │◀─────▶│  Home Assistant (headless)     │
  │  - karty, scény    │  WS/  │  ├ Zigbee2MQTT  → IKEA žárovky  │
  │  - tlačítko kávy   │  REST │  ├ SonoffLAN    → pásek + B02   │
  └───────────────────┘  (LAN) │  ├ Shelly       → relé Jura     │
                                │  └ scény, plánovač, historie   │
                                └───────────────────────────────┘
```

- **Práce:** dny (píšeš jen frontend).
- **Co dostaneš zdarma:** integrace všech zařízení, scény, plánovač
  (cron i „při západu slunce"), historie/grafy, zálohy, obnovení stavu po
  restartu, add-ony.
- **Nevýhoda:** na hubu běží HA (nevidíš ho, ale je tam). To ti nevadí — je to
  jen lokální API server.

### Varianta 2 — MQTT-hub DIY: vlastní malý backend nad MQTT ⭐ „truly yours", rozumná práce

Bez plného HA. Necháš běžet jen **Mosquitto (MQTT broker) + Zigbee2MQTT** (to
potřebuješ na IKEA tak jako tak), Sonoff Wi-Fi přeflashneš na **Tasmota/ESPHome**
a Shelly přepneš do **MQTT** módu. Pak **všechno mluví jedním protokolem — MQTT**.
Napíšeš si vlastní malý backend (Node/Hono — přesně jako `proxy/` v tomhle repu),
který MQTT poslouchá, drží stav, dělá scény/plánovač a servíruje čisté API tvé PWA.

```
 [iPad / mobil]        [ HUB ]
  ┌────────────┐   ┌───────────────────────────────────────────┐
  │ Tvoje PWA  │◀─▶│  Tvůj backend (Hono + ws)  ──▶ scény, čas  │
  └────────────┘WS │        ▲  MQTT (jeden protokol)            │
                   │        │                                    │
                   │   ┌────┴─────┐  ┌──────────┐  ┌──────────┐ │
                   │   │Zigbee2MQTT│  │ Shelly   │  │ Sonoff   │ │
                   │   │ → IKEA    │  │ (MQTT)   │  │(Tasmota/ │ │
                   │   │           │  │ → Jura   │  │ ESPHome) │ │
                   │   └───────────┘  └──────────┘  └──────────┘ │
                   └───────────────────────────────────────────┘
```

- **Práce:** týdny (backend + frontend), ale je to přímočaré — jeden protokol.
- **Co dostaneš:** maximální kontrola a „je to celé moje", stále lokální.
- **Co si musíš napsat sám:** stavový model, scény, plánovač, persistence,
  obnovení po restartu, ošetření výpadků zařízení. (Zigbee párování řeší
  Zigbee2MQTT — to nepíšeš.)
- **Předpoklad:** ochota **flashnout** Sonoff Wi-Fi zařízení na Tasmota/ESPHome
  (u B02-BL-A60 nemusí jít — pak by tato žárovka potřebovala eWeLink LAN můstek
  navíc, což kazí čistotu „vše přes MQTT" → viz rizika).

### Varianta 3 — Pure DIY (vlastní ovladač pro každý protokol) ❌ nedoporučeno

Vlastní kód mluví přímo se Zigbee čipem, eWeLink šifrováním, atd. Fakticky píšeš
vlastní Home Assistant. Obrovská práce a věčná údržba. **Nedělat.**

### Srovnání

| Kritérium | V1: HA headless | V2: MQTT DIY | V3: Pure DIY |
|---|---|---|---|
| Vlastní UI/UX | ✅ | ✅ | ✅ |
| Práce na start | 🟢 dny | 🟡 týdny | 🔴 měsíce |
| „Je to celé moje" | 🟡 (HA uvnitř) | 🟢 | 🟢 |
| Scény/plánovač zdarma | ✅ | ❌ (píšeš) | ❌ |
| Historie, zálohy, obnova stavu | ✅ | ❌ (řešíš) | ❌ |
| Údržba při změně u výrobce | 🟢 komunita | 🟡 ty (jen MQTT vrstva) | 🔴 ty (vše) |
| Zigbee párování | ✅ Z2M | ✅ Z2M | ❌ píšeš |
| Riziko projektu | 🟢 nízké | 🟡 střední | 🔴 vysoké |

---

## 8.3 Doporučení

- **Chceš to rychle a spolehlivě, s prostorem doladit UI donekonečna → Varianta 1.**
  HA je headless engine, ty žiješ ve své PWA. Kdykoli později můžeš přejít na V2,
  protože HA tě nenutí používat jeho UI.
- **Baví tě to stavět, chceš „svůj systém" a jsi OK s flashováním + týdny práce →
  Varianta 2.** Je čistá (jeden protokol, MQTT) a přesně sedí na tvůj styl z tohoto
  repa (Hono backend + React PWA). Bez Tada je reálná.

> **Můj tip:** začni **Variantou 1** a postav si nádhernou vlastní PWA nad HA API.
> Získáš funkční systém rychle. Pokud tě to chytne a budeš chtít vlastní engine,
> migrace na V2 je pak přirozený druhý krok (PWA zůstává, měníš jen, s čím mluví).
> Ušetříš si tím riziko, že se zasekneš na psaní plánovače místo na tom, co tě
> baví — na appce.

---

## 8.4 Datový tok a klíčové API (pro V1)

HA má stabilní **WebSocket API** (real-time stavy + volání služeb) a **REST API**.

- **Autentizace:** *Long-Lived Access Token* (HA → profil → dole). Uloží se v appce.
- **Real-time stav:** přihlásíš se k `subscribe_events` / `state_changed` → appka
  má okamžitě aktuální stav všech `light.*`, `switch.*`, `sensor.*`.
- **Akce = volání služby:**
  - Světlo: `light.turn_on` / `turn_off` (+ `brightness_pct`, `rgb_color`, `color_temp`)
  - Kávovar: `script.jura_spustit` (pulz — logika viz [`03`](03-kavovar-jura.md))
  - Scéna: `scene.turn_on`
- **Knihovna:** oficiální **`home-assistant-js-websocket`** (npm) — řeší auth,
  reconnect i cache stavů. Nemusíš psát WS ručně.

## 8.5 Technologický stack (reuse toho, co v repu už umíme)

| Vrstva | Volba | Pozn. |
|--------|-------|-------|
| Frontend | **React + TypeScript + Vite** | jako `web/` v tomto repu |
| PWA | **vite-plugin-pwa** | offline shell, „Přidat na plochu", fullscreen |
| Stav/data | TanStack Query + `home-assistant-js-websocket` | live stavy entit |
| UI/animace | Framer Motion, vlastní komponenty | tvoje karty místností, velké tlačítko kávy |
| (V2) Backend | **Hono + MQTT.js + ws** | jako `proxy/` v tomto repu |

## 8.6 Bezpečnost a síť (nepodcenit — jinak to na iPadu „nejede")

1. **Mixed-content past (iOS):** PWA běží přes **HTTPS**. Prohlížeč pak **zakáže**
   volání na `http://<hub>:8123`. Řešení:
   - HA za **reverzní proxy s TLS** (Nginx/Caddy add-on) na lokální doméně
     (`https://ha.doma.lan`) s platným certifikátem (lokální CA / Let's Encrypt
     přes DNS), **nebo**
   - servírovat PWA i HA API ze **stejného originu** (appka jako custom panel /
     za stejnou proxy).
2. **Token:** Long-Lived Token drž jen v appce (localStorage) na důvěryhodném
   iPadu; nevystavuj appku do internetu bez další ochrany.
3. **Jen lokálně:** appka i hub na stejné (IoT-oddělené, ale vzájemně dostupné)
   síti — viz [`01`](01-architektura.md). mDNS/`.lan` doména usnadní stabilní adresu.
4. **Bez cloudu:** celé to běží po LAN → funguje i při výpadku internetu.

## 8.7 Limity PWA na iOS (ať tě nic nepřekvapí)

- ✅ **Ovládací panel:** funguje skvěle — fullscreen, „na plochu", dotykové UI.
- ✅ **Kiosk:** „Přidat na plochu" + **Guided Access** = zamčený nástěnný panel.
- ⚠️ **Notifikace:** na iOS jen z home-screen instalované PWA a od iOS 16.4+;
  méně spolehlivé než nativní. Pro „káva hotová" použitelné, ale ne 100%.
- ⚠️ **Běh na pozadí:** iOS PWA nemá pořádný background → appka je „živá", když je
  na obrazovce. Pro nástěnný iPad (pořád zapnutý, Guided Access) to nevadí.
- ➡️ Kdybys někdy chtěl tvrdé notifikace/widgety, řešením je **React Native / nativní**
  appka nad stejným HA API (fáze 2, nepovinné).

## 8.8 Fáze buildu (návrh)

Odpovídá stylu tohoto repa (fázový, ověřitelný postup):

1. **Fáze 0 — Základ backendu:** zprovoznit HA headless (V1) a ověřit, že
   REST/WS API vrací stavy a přijímá volání služeb. Vytvořit token.
2. **Fáze 1 — Scaffold PWA:** Vite + React + TS + PWA, připojení přes
   `home-assistant-js-websocket`, „hello state" (vypsat entity živě).
3. **Fáze 2 — Ovládání světel:** karty místností, zap/vyp, jas, barva/teplota;
   skupiny (obývák/kuchyň/ložnice).
4. **Fáze 3 — Kávovar:** velké tlačítko „Uvařit kávu" → `script.jura_spustit`;
   (volitelně stav přes měřenou spotřebu).
5. **Fáze 4 — Scény:** „Vše vypnout", „Večerní relax", „Ráno" jako dlaždice.
6. **Fáze 5 — TLS + kiosk:** reverzní proxy s certifikátem, instalace na iPad,
   Guided Access, doladění pro rozlišení iPadu.
7. **Fáze 6 (volitelně) — Migrace na V2:** vlastní MQTT backend, pokud budeš chtít
   plnou nezávislost na HA.

## 8.9 Otevřené otázky k rozhodnutí

- [ ] **V1 vs. V2** — začínáme HA-headless (rychle), nebo rovnou vlastní MQTT backend?
- [ ] Jsi ochoten **flashnout** Sonoff Wi-Fi zařízení na Tasmota/ESPHome (nutné pro čisté V2)?
- [ ] Cílová primární obrazovka appky: nástěnný iPad **na šířku**, nebo i mobil na výšku?
- [ ] Doména + TLS: máš lokální DNS/router, kde založíme `ha.doma.lan` + certifikát?
