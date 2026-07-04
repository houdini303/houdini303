# 02 — Osvětlení: Sonoff Wi-Fi + IKEA/Zigbee žárovky

Máme dva různé „světy" osvětlení, které v HA sjednotíme do jednoho rozhraní:

1. **Sonoff Wi-Fi zařízení** (eWeLink) → lokální řízení přes SonoffLAN / ESPHome / Tasmota:
   - **Sonoff LED pásek**, deviceid `1001100b5d`
   - **Sonoff B02-BL-A60** — Wi-Fi žárovka, laditelná bílá E27 (**pozor: Wi-Fi, ne Zigbee!**)
2. **Zigbee žárovky** (IKEA Trådfri + případně další Zigbee značky)
   → přes jeden Zigbee most (Zigbee2MQTT).

Výsledkem jsou entity typu `light.*`, které se v HA i na dashboardu chovají
stejně, bez ohledu na to, jak jsou fyzicky připojené.

> **Poznámka k Sonoff žárovce:** označení **B02-BL-A60** znamená Wi-Fi žárovku
> (řada „B..“ = bulb, komunikace přes eWeLink Wi-Fi), takže **nejde do Zigbee2MQTT**
> — patří ke stejné cestě jako Wi-Fi LED pásek (sekce 2.1, SonoffLAN). Kdybys měl
> i Sonoff **Zigbee** žárovku (řada „SNZB“ apod.), ta by šla do Zigbee2MQTT.

---

## 2.1 Sonoff LED pásky (Wi-Fi)

Sonoff Wi-Fi pásky (např. L1 / L1-Lite / L2/L3) jedou z výroby přes cloud
**eWeLink** → prodleva a závislost na internetu. Chceme lokál. Tři cesty:

| Cesta | Lokální? | Náročnost | Poznámka |
|-------|----------|-----------|----------|
| **ESPHome** (přeflashnutí) | ✅ plně lokální | střední (nutný flash) | **Doporučeno** — nulová prodleva, plná kontrola |
| **Tasmota** (přeflashnutí) | ✅ plně lokální | střední | fajn alternativa k ESPHome |
| **Sonoff LAN (HACS integrace)** | ⚠️ lokální „LAN mód", ale ne u všech modelů plně | nízká (bez flashe) | rychlá cesta, ale u RGB pásků bývá LAN mód omezený |

### Doporučení: ESPHome

**Proč:** nativní, extrémně rychlá lokální integrace přímo do HA (žádný cloud,
žádné MQTT nutné), stabilní a plná kontrola nad efekty a přechody.

**⚠️ Ověř model před flashem.** Novější Sonoff pásky mívají čip **ESP32** —
většinou lze flashovat přes OTA nástroj / sériově. Některé „miniverze" mají
neflashovatelný BK72xx (pak zůstaň u Tasmota přes `LibreTiny`, nebo Sonoff LAN).
**Krok 1 z akceptačních výstupů = potvrdit přesný model a čip.**

Ilustrační ESPHome konfigurace pro RGB(W) pásek (adresní/analogový uprav dle HW):

```yaml
# esphome/sonoff-led-strip.yaml  (ILUSTRACE — piny a typ dle konkrétního modelu!)
esphome:
  name: pasek-obyvak
esp32:
  board: esp32dev

wifi:
  ssid: !secret iot_wifi_ssid
  password: !secret iot_wifi_pass
  # fallback AP kdyby se nepřipojil
  ap:
    ssid: "pasek-obyvak-fallback"

api:            # nativní lokální spojení s HA (žádný cloud)
ota:
logger:

# Příklad pro analogový RGBW pásek řízený PWM (u adresního WS2812 použij platformu
# 'esp32_rmt_led_strip' + light 'addressable_rgb'):
output:
  - platform: ledc
    pin: GPIO4
    id: out_r
  - platform: ledc
    pin: GPIO12
    id: out_g
  - platform: ledc
    pin: GPIO14
    id: out_b
  - platform: ledc
    pin: GPIO5
    id: out_w

light:
  - platform: rgbw
    name: "Pásek obývák"
    red: out_r
    green: out_g
    blue: out_b
    white: out_w
    effects:
      - random:
      - pulse:
```

Po flashi HA pásek **automaticky objeví** (ESPHome integrace) → vznikne entita
`light.pasek_obyvak`.

### Doporučená cesta pro tvá zařízení: SonoffLAN (HACS)

Pro **tvůj konkrétní pásek (`1001100b5d`)** i **žárovku B02-BL-A60** je nejsnazší
a nejrychlejší cesta **SonoffLAN** — žárovky řady B02 mají navíc proprietární čip,
který se prakticky nedá přeflashovat, takže ESPHome u nich odpadá.

1. V HACS nainstaluj integraci **SonoffLAN** (autor AlexxIT).
2. Přihlas se jednou účtem eWeLink (kvůli stažení seznamu zařízení a klíčů) — pak už
   běží lokálně.
3. Přepni integraci na režim **`local`** (LAN mód), ať se necloudí.
4. V seznamu zařízení najdeš pásek podle **deviceid `1001100b5d`** a žárovku
   B02-BL-A60 → pojmenuj entity (`light.obyvak_pasek`, `light.loznice_zarovka`).

> **Předpoklad LAN módu:** zařízení musí mít v eWeLink aktuální firmware a být na
> stejné (IoT) L2 síti jako hub (mDNS). SonoffLAN si po prvním cloud přihlášení
> stáhne šifrovací klíče a dál komunikuje po LAN i bez internetu.

**Vlastnosti entit:**
- **B02-BL-A60** = laditelná bílá → v HA `light` s podporou **jasu** a **teploty
  bílé** (`color_temp`), bez plné RGB palety.
- **LED pásek** — dle modelu jas / barva; pokud je RGB, čekej `rgb_color`.

> Kompromis SonoffLAN: u některých RGB pásků bývá LAN mód omezený (jas ano, plná
> paleta ne vždy). Pokud u pásku `1001100b5d` narazíš na limity a půjde flashnout
> (ESP32/ESP8266), přejdi na **ESPHome** dle konfigurace výše. Žárovku B02 nech na
> SonoffLAN.

---

## 2.2 Zigbee žárovky (IKEA Trådfri + další Zigbee značky)

Máme **smíšený ekosystém značek** — to je přesně situace, kde Zigbee vyhrává:
jeden koordinátor (dongle) + jeden most a **všechny Zigbee značky se sejdou v
jednom rozhraní**, lokálně a bez cloudů výrobců.

> Sonoff žárovka **B02-BL-A60 sem NEpatří** — je Wi-Fi (viz sekce 2.1). Do
> Zigbee2MQTT jde IKEA Trådfri a případné další **Zigbee** žárovky (Sonoff SNZB,
> Philips Hue bez můstku, Tuya Zigbee, Müller…).

### Hardware, který přibyde

- **Zigbee USB dongle (koordinátor):** Sonoff **ZBDongle-E** (EFR32MG21) nebo
  **Dongle-P** (CC2652P). Zasune se do hubu.
- **USB prodlužka** — dongle odsaď od hubu (rušení z USB 3.0 portů a zdrojů
  degraduje 2,4 GHz Zigbee).

### Zigbee2MQTT vs. ZHA

| | **Zigbee2MQTT (Z2M)** | **ZHA** |
|---|---|---|
| Podpora zařízení | nejširší (i exotika) | dobrá, o něco užší |
| Diagnostika (mapa sítě, OTA) | špičková | slabší |
| Závislost na MQTT | ano (Mosquitto) | ne |
| Nezávislost na HA | ano (běží i samostatně) | ne |

> **Rozhodnutí projektu: Zigbee2MQTT.** Nejlepší podpora smíšeného parku (IKEA +
> Sonoff + další) a nejlepší nástroje na správu sítě.

### Párování žárovek

1. Nainstaluj add-ony **Mosquitto broker** a **Zigbee2MQTT** (viz [`06`](06-postup-instalace.md)).
2. V Zigbee2MQTT nastav cestu k donglu (`/dev/serial/by-id/...`) a adaptér
   (`ezsp` pro Dongle-E, `zstack` pro Dongle-P).
3. Zapni **„Permit join"** (na omezenou dobu — pak zase vypni kvůli bezpečnosti).
4. **IKEA Trådfri žárovka:** reset = 6× rychle cvaknout vypínačem (nebo párovací
   sekvence dle typu). Objeví se v Z2M → dej jí čitelné jméno (`obyvak_hlavni`).
5. Ostatní **Zigbee** značky (Sonoff SNZB, Philips Hue bez můstku, Tuya Zigbee,
   Müller…) — Z2M zvládá, párování dle konkrétního typu.

> 💡 **Tip na dosah (mesh):** Zigbee žárovky, které jsou **trvale pod proudem**,
> fungují jako **routery** a posilují síť. Žárovka na vypínači, který lidé
> vypínají, ze sítě vypadává — tomu se u kritických uzlů vyhni (nech ji trvale
> napájenou a spínej „chytře").

Každá žárovka → entita `light.*` s podporou jasu a barvy (dle modelu:
teplá/studená bílá vs. plné RGB).

---

## 2.3 Sjednocení: zóny, skupiny a pojmenování

Aby dashboard i scény byly přehledné, seskup světla logicky.

### Konvence pojmenování entit

`light.<mistnost>_<popis>` → `light.obyvak_pasek`, `light.kuchyn_strop`,
`light.loznice_nocni`. Konzistence se ti vyplatí u scén i hlasového ovládání.

### Skupiny (jedna entita = celá místnost/zóna)

```yaml
# packages/osvetleni.yaml
light:
  - platform: group
    name: "Obývák – vše"
    entities:
      - light.obyvak_pasek
      - light.obyvak_hlavni
      - light.obyvak_nocni

  - platform: group
    name: "Kuchyň – vše"
    entities:
      - light.kuchyn_strop
      - light.kuchyn_pasek_linka
```

Skupina `light.group` se ovládá jako jedno světlo (zap/vyp, jas, a pokud všechna
podřízená umí barvu, i barva) — ideální dlaždice „celá místnost" na dashboardu.

> Pro **zóny** (např. „přízemí", „patro") můžeš skupiny vnořovat, nebo použít
> **Areas/oblasti** v HA (Nastavení → Oblasti) a přiřadit zařízení k místnostem —
> to pak hezky funguje s auto-generovanými pohledy a Mushroom kartami.
