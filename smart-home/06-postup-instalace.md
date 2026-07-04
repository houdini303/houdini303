# 06 — Postup instalace (checklist krok za krokem)

Praktický, odškrtávací postup celého nasazení. Odpovídá „Očekávaným výstupům"
ze zadání (analýza → server → párování → UI a logika).

## Fáze 1 — Analýza a příprava

- [ ] **Ověřit přesné modely** LED pásků a žárovek (kritické!):
  - [ ] Sonoff LED pásek: model + čip → lze flashovat ESPHome/Tasmota? (viz [`02`](02-osvetleni.md))
  - [ ] IKEA žárovky: potvrdit Zigbee (Trådfri ano) + typ (bílá / RGB)
  - [ ] Sonoff žárovka: Zigbee, nebo Wi-Fi? (podle toho most Z2M vs. ESPHome/LAN)
  - [ ] Další značky žárovek: podpora v Zigbee2MQTT (zigbee2mqtt.io → *Supported devices*)
- [ ] Kávovar Jura: potvrdit model a že jde o **jednotlačítkové** ovládání (viz [`03`](03-kavovar-jura.md))
- [ ] Nakoupit chybějící HW: hub, Zigbee dongle (+ USB prodlužka), Shelly Plus 1, (volitelně měřicí zásuvka)
- [ ] Rozhodnout orientaci nástěnného iPadu (na šířku doporučeno)

## Fáze 2 — Instalace serveru (Home Assistant)

- [ ] Nainstalovat **Home Assistant OS** na hub (Pi Imager / obraz pro mini-PC)
- [ ] Projít úvodní setup, vytvořit účet, nastavit lokaci/časové pásmo (kvůli 7:00 apod.)
- [ ] Router: **DHCP rezervace** (statické IP) pro hub, iPad, relé, pásky
- [ ] (Doporučeno) zřídit **IoT VLAN / oddělené SSID** (viz [`01`](01-architektura.md))
- [ ] Zapnout **automatické zálohy** a nastavit jejich ukládání mimo hub
- [ ] Nainstalovat **HACS**:
  - Nastavení → Doplňky → Get **HACS** (dle návodu hacs.xyz), restart, přidat integraci HACS, autorizovat přes GitHub
- [ ] Přes HACS doinstalovat karty: **Mushroom**, **card-mod**, **kiosk-mode**, (volitelně layout-card, Scheduler card)
- [ ] Nainstalovat add-ony: **Mosquitto broker**, **Zigbee2MQTT**, **ESPHome**, **Studio Code Server**
- [ ] Nastavit `configuration.yaml`:
  ```yaml
  homeassistant:
    packages: !include_dir_named packages
  ```
  a založit složku `packages/` + `secrets.yaml` (Wi-Fi IoT SSID/heslo)

## Fáze 3 — Napárování zařízení

### Zigbee žárovky (IKEA + Sonoff + další)
- [ ] Zasunout Zigbee dongle (přes USB prodlužku), v Zigbee2MQTT nastavit port + adaptér
- [ ] Zapnout „Permit join", spárovat žárovky, pojmenovat je (`obyvak_hlavni`, …)
- [ ] **Vypnout „Permit join"** po dokončení
- [ ] Zálohovat **Zigbee network key** (Z2M → Settings)

### Sonoff LED pásky (Wi-Fi)
- [ ] Cesta A (doporučeno): **ESPHome** — vytvořit konfiguraci, flashnout, ověřit auto-discovery v HA
- [ ] Cesta B (bez flashe): HACS **SonoffLAN**, přihlásit eWeLink, přepnout na LAN mód
- [ ] Ověřit, že vzniklé entity `light.*` reagují bez prodlevy

### Kávovar (relé)
- [ ] ⚠️ **Elektrikář** zapojí Shelly Plus 1 (bezpotenciálový kontakt) paralelně k tlačítku (odpojené od sítě!)
- [ ] Připojit Shelly na IoT Wi-Fi, potvrdit auto-discovery v HA → `switch.jura_rele`
- [ ] Nastavit na Shelly **Auto-OFF ~0,4 s** (pojistka pulzu)

## Fáze 4 — Logika a UI

- [ ] `packages/kavovar.yaml`: `script.jura_spustit` (pulz) + `button.uvarit_kavu` (viz [`03`](03-kavovar-jura.md))
- [ ] **Otestovat pulz** (bezpečně, s vodou): script skutečně „zmáčkne" tlačítko; doladit délku 300–600 ms
- [ ] `packages/osvetleni.yaml`: skupiny světel podle místností (viz [`02`](02-osvetleni.md))
- [ ] `packages/sceny.yaml`: „Vše vypnout", „Večerní relax", „Ráno" (viz [`05`](05-automatizace-sceny.md))
- [ ] `packages/automatizace.yaml`: ranní kávovar Po–Pá 7:00 (+ helper pro nastavitelný čas)
- [ ] `dashboards/ipad.yaml`: Lovelace pro iPad (Mushroom, sekce, kiosk-mode) (viz [`04`](04-dashboard-ipad.md))
- [ ] Ověřit rozvržení v prohlížeči na rozlišení iPadu (DevTools → responsivní režim)

## Fáze 5 — iPad kiosk

- [ ] Nainstalovat oficiální app **Home Assistant** (App Store), přihlásit do **lokální** instance
- [ ] Otevřít dashboard „Domov"
- [ ] iOS: Nastavení → Displej a jas → **Auto-Lock = Nikdy**
- [ ] iOS: Nastavení → Zpřístupnění → **Guided Access** → zapnout, nastavit kód
- [ ] V HA app **trojklik** bočního/domácího tlačítka → spustit Guided Access (zamkne na app)
- [ ] Nástěnný držák + napájení (trvale); zvážit USB nabíječku s dostatečným proudem
- [ ] (Volitelně) noční ztlumení jasu obrazovky automatizací

## Fáze 6 — Doladění a předání

- [ ] Projít každou místnost: zap/vyp, jas, barva funguje na dotek bez prodlevy
- [ ] Scény vypadají dobře (doladit barvy/jas přímo z reálného světla)
- [ ] Ranní kávovar otestovat (nastavit čas na „za 2 min" a ověřit spuštění)
- [ ] Zkouška výpadku internetu: odpojit WAN → vše lokální musí dál fungovat
- [ ] Finální **záloha** HA + export Zigbee klíče, uložit bezpečně
- [ ] Krátký „návod pro uživatele domácnosti" (co která dlaždice dělá)

---

## Odkazy

- Home Assistant: https://www.home-assistant.io/
- HACS: https://hacs.xyz/
- Zigbee2MQTT (podporovaná zařízení): https://www.zigbee2mqtt.io/
- ESPHome: https://esphome.io/
- Mushroom karty: https://github.com/piitaya/lovelace-mushroom
- kiosk-mode: https://github.com/NemesisRE/kiosk-mode
