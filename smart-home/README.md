# Smart Home — integrace a dashboard (Home Assistant)

Kompletní technický plán a průvodce zprovozněním centrálního systému chytré
domácnosti běžícího **lokálně** na Home Assistantu, s ovládacím rozhraním na
nástěnném iPadu (kiosk).

> **Filozofie projektu:** vše běží primárně **lokálně**, s minimální závislostí
> na cloudech třetích stran (eWeLink, Tuya…). Cloud je maximálně záloha, ne
> podmínka funkčnosti. Cíl je nulová prodleva při stisku tlačítka a chod i při
> výpadku internetu.

## Zařízení v projektu

| Kategorie | Zařízení | Cílová integrace |
|-----------|----------|------------------|
| Osvětlení | Sonoff LED pásky (Wi-Fi) | Lokálně — **ESPHome** (doporučeno) nebo Sonoff LAN / Tasmota |
| Osvětlení | IKEA Trådfri žárovky | **Zigbee** přes Zigbee2MQTT |
| Osvětlení | Sonoff Zigbee žárovka + další značky | **Zigbee** přes Zigbee2MQTT (jeden most pro všechny) |
| Kávovar | Jura + Wi-Fi relé (Shelly Plus 1 / Sonoff Mini) | Lokálně — relé jako `switch`, ovládání přes pulzní `script` |
| Rozhraní | Nástěnný iPad | HA app v kiosk módu (Guided Access) |

## Obsah dokumentace

| Dokument | Co řeší |
|----------|---------|
| [`01-architektura.md`](01-architektura.md) | HW hub, síť, VLAN, zálohy, add-ony, MQTT broker |
| [`02-osvetleni.md`](02-osvetleni.md) | Sonoff pásky (ESPHome), Zigbee žárovky (IKEA + Sonoff), skupiny a zóny |
| [`03-kavovar-jura.md`](03-kavovar-jura.md) | Zapojení relé (bezpečnost!), pulzní logika, `script` a `button` |
| [`04-dashboard-ipad.md`](04-dashboard-ipad.md) | Lovelace layout pro iPad, karty místností, kiosk mód |
| [`05-automatizace-sceny.md`](05-automatizace-sceny.md) | Scény ("Večerní relax", "Vše vypnout"), ranní kávovar 7:00 |
| [`06-postup-instalace.md`](06-postup-instalace.md) | Krok-za-krokem checklist celého nasazení |

## Doporučený nákupní seznam (nad rámec toho, co už máš)

- **Hub:** Raspberry Pi 5 (4–8 GB) + kvalitní napájení + microSD **nebo** (lepší)
  SSD přes USB. Alternativa: starší mini-PC (x86) — spolehlivější a rychlejší.
- **Zigbee koordinátor (USB dongle):** Sonoff Zigbee 3.0 USB Dongle Plus (model
  **ZBDongle-E**, čip EFR32MG21) nebo Dongle-P (CC2652P). **Nutné** pro IKEA a
  Sonoff Zigbee žárovky. Doporučuje se USB prodlužka (odsazení od rušení USB 3.0).
- **Wi-Fi relé ke kávovaru:** Shelly Plus 1 (doporučeno — má bezpotenciálový
  kontakt SW/O) nebo Sonoff MINIR3/MINI.
- **Síť:** samostatná IoT VLAN / SSID (viz [`01-architektura.md`](01-architektura.md)).

## TL;DR postup

1. Nainstaluj **Home Assistant OS** na hub (nejsnazší cesta k add-onům).
2. Přidej **HACS** a **Mosquitto MQTT broker** + **Zigbee2MQTT** add-on.
3. Zasuň Zigbee dongle, spáruj IKEA + Sonoff žárovky do Zigbee2MQTT.
4. Sonoff LED pásky přeflashuj na **ESPHome** (nebo použij Sonoff LAN) → lokální řízení.
5. Elektrikář zapojí relé paralelně ke spínači Jury; přidej ho do HA jako `switch`
   a vytvoř pulzní `script` (viz [`03`](03-kavovar-jura.md)).
6. Postav **Lovelace dashboard** pro iPad a nastav **scény + ranní automatizaci**.
7. iPad → HA app + **Guided Access** = kiosk.

> ⚠️ **Bezpečnost:** zapojení relé do 230 V kávovaru smí provést jen osoba s
> příslušnou kvalifikací. Detaily a bezpečné varianty viz
> [`03-kavovar-jura.md`](03-kavovar-jura.md).
