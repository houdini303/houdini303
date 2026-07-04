# 01 — Hardwarová a systémová architektura

## 1.1 Centrální server (Hub)

### Volba hardwaru

| Varianta | Výhody | Nevýhody | Doporučení |
|----------|--------|----------|------------|
| **Raspberry Pi 5** (4–8 GB) | levné, tiché, malý příkon | výkon SD karty, náchylnost k opotřebení SD | ✅ dobrá volba, ale **boot z SSD/USB**, ne z microSD |
| **Starší mini-PC / NUC (x86)** | výrazně vyšší výkon, spolehlivé SSD, rezerva na kamery/další add-ony | vyšší příkon, cena | ✅ nejlepší dlouhodobá volba |
| Stará „velká" PC skříň | výkon zdarma | hluk, spotřeba, místo | jen dočasně |

**Doporučení:** pokud Pi, tak **Pi 5 + oficiální aktivní chlazení + SSD přes USB**.
SD karty u HA po měsících zápisů umírají — je to nejčastější příčina „rozbité"
domácnosti.

### Operační systém — instalace HA

Doporučená varianta je **Home Assistant OS (HAOS)** — dává „supervisor" a tím
snadné **add-ony** (Zigbee2MQTT, Mosquitto, ESPHome, zálohy) na jedno kliknutí.

| Instalační varianta | Kdy použít |
|---------------------|-----------|
| **HAOS na holém železe** (Pi/mini-PC) | ✅ výchozí volba — nejjednodušší, plná podpora add-onů |
| HA Supervised (Debian + Docker) | pokročilí, když stroj dělá i jiné věci |
| HA Container (čistý Docker) | bez add-onů (Zigbee2MQTT/MQTT řešíš vlastními kontejnery) |
| HA Core (venv) | nedoporučeno pro tento projekt |

> Pro tento projekt **HAOS**. Šetří desítky hodin a přesně odpovídá požadavku
> „lokálně, s add-ony (HACS, MQTT)".

## 1.2 Síťová architektura (důležité pro lokální řízení a bezpečnost)

IoT zařízení (Sonoff, relé) jsou bezpečnostně slabá. Ideál:

- **Samostatná IoT VLAN / oddělené SSID** pro všechna chytrá zařízení.
- HA hub má přístup do IoT VLAN (aby mohl mluvit s ESPHome/Shelly zařízeními),
  ale IoT zařízení **nemají** přístup do hlavní LAN ani na internet (kromě NTP).
- mDNS/discovery mezi VLAN vyřeš pomocí **Avahi/mDNS reflectoru** na routeru
  (jinak HA nenajde ESPHome/Shelly automaticky).

Pokud VLAN nemáš k dispozici, minimum je **statické IP** (DHCP rezervace) pro hub,
iPad a všechna relé — ať se ti adresy neposunou.

### Statické IP / rezervace

Na routeru nastav DHCP rezervaci (podle MAC) pro:
- Home Assistant hub
- nástěnný iPad
- každé Wi-Fi relé (Shelly/Sonoff) a Sonoff pásek

## 1.3 Software: doplňky (add-ony), které nainstalujeme

| Add-on / komponenta | K čemu | Poznámka |
|---------------------|--------|----------|
| **HACS** | komunitní integrace/karty (Sonoff LAN, Mushroom karty, kiosk-mode) | instaluje se ručně, viz [`06`](06-postup-instalace.md) |
| **Mosquitto broker** | MQTT broker | potřebný pro Zigbee2MQTT a ESPHome (volitelně) |
| **Zigbee2MQTT** | most pro Zigbee žárovky (IKEA + Sonoff + další) | vyžaduje Zigbee USB dongle |
| **ESPHome** | firmware + správa Sonoff pásků | lokální řízení bez cloudu |
| **Studio Code Server / File editor** | editace YAML | pohodlná editace `packages/`, `lovelace` |
| **Samba / zálohy** | přístup a zálohování | viz níže |

### MQTT — potřebujeme ho?

- **Zigbee2MQTT: ano** — jméno napovídá, komunikuje přes MQTT broker (Mosquitto).
- **ZHA** (alternativa Z2M): MQTT nepotřebuje. Srovnání viz [`02`](02-osvetleni.md).
- **ESPHome:** nativně mluví s HA přlmo (API), MQTT nepotřebuje. Ale je fajn mít
  broker tak jako tak.

> **Rozhodnutí projektu:** dáme **Mosquitto + Zigbee2MQTT**. Z2M má nejširší
> podporu zařízení (IKEA i Sonoff Zigbee) a lepší diagnostiku sítě.

## 1.4 Zálohy (nepodceňovat)

- Zapni **automatické zálohy HA** (Nastavení → Systém → Zálohy) na denní bázi.
- Zálohy posílej **mimo hub** — Samba share na NAS, nebo add-on pro upload na
  síťové úložiště. Záloha na stejné SD kartě je k ničemu.
- Ulož zvlášť **klíč Zigbee sítě** (network key ze Zigbee2MQTT) — bez něj bys po
  havárii musel párovat všechny žárovky znovu.

## 1.5 Struktura konfigurace (přehlednost)

Doporučuji rozdělit konfiguraci do tzv. **packages** místo jednoho obřího
`configuration.yaml`. V `configuration.yaml`:

```yaml
homeassistant:
  packages: !include_dir_named packages
```

A pak jednotlivé logické celky:

```
/config/
├── configuration.yaml
├── packages/
│   ├── osvetleni.yaml        # skupiny světel, zóny
│   ├── kavovar.yaml          # relé + pulzní script + button
│   ├── sceny.yaml            # scény
│   └── automatizace.yaml     # ranní kávovar apod.
└── dashboards/
    └── ipad.yaml             # Lovelace pro iPad (mód YAML)
```

Toto členění používají i další dokumenty v této složce.
