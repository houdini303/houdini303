# 05 — Scény a automatizace

Scény = uložený „stav" více zařízení najednou (světla + barvy + jas). Automatizace
= „když se stane X, udělej Y". Obojí lze vytvářet klikací v UI (Nastavení →
Automatizace a scény) — níže jsou ekvivalenty v YAML pro `packages/`.

## 5.1 Scény

### „Vše vypnout" (script — zhasne vše)

Praktičtější jako `script` (zhasne vše bez ohledu na stav) než jako scéna:

```yaml
# packages/sceny.yaml
script:
  vse_vypnout:
    alias: "Vše vypnout"
    icon: mdi:power
    sequence:
      - service: light.turn_off
        target:
          entity_id: all      # zhasne všechna světla
      # případně i další zóny/skupiny explicitně:
      # target: {entity_id: [light.obyvak_vse, light.kuchyn_vse, light.loznice_vse]}
```

### „Večerní relax" (teplé tlumené světlo)

```yaml
# packages/sceny.yaml
scene:
  - name: "Večerní relax"
    id: vecerni_relax
    icon: mdi:weather-night
    entities:
      light.obyvak_pasek:
        state: on
        brightness_pct: 25
        rgb_color: [255, 140, 40]     # teplá oranžová
      light.obyvak_hlavni:
        state: off
      light.obyvak_nocni:
        state: on
        brightness_pct: 40

  - name: "Ráno"
    id: rano
    icon: mdi:weather-sunny
    entities:
      light.kuchyn_vse:
        state: on
        brightness_pct: 90
        color_temp_kelvin: 4500       # svěží bílá
      light.obyvak_hlavni:
        state: on
        brightness_pct: 70
```

> 💡 **Snáz:** nastav světla ručně do kýženého stavu a v HA klikni *Vytvořit scénu
> z aktuálního stavu* — HA ti vygeneruje YAML sám.

Spouštění scény: `scene.turn_on` s `entity_id: scene.vecerni_relax` (viz dlaždice
v [`04`](04-dashboard-ipad.md)).

## 5.2 Automatizace: ranní kávovar (pracovní dny 7:00)

```yaml
# packages/automatizace.yaml
automation:
  - alias: "Kávovar – ranní spuštění (Po–Pá 7:00)"
    id: jura_rano
    trigger:
      - platform: time
        at: "07:00:00"
    condition:
      - condition: time
        weekday: [mon, tue, wed, thu, fri]
      # volitelně: jen když je někdo doma
      # - condition: state
      #   entity_id: group.rodina
      #   state: "home"
    action:
      - service: script.jura_spustit
    mode: single
```

> Chceš-li čas měnit z dashboardu bez editace YAML, přidej **`input_datetime`**
> (helper) a v triggeru použij `platform: time` s `at: input_datetime.cas_kavy`.
> Na iPadu pak dáš time-picker dlaždici. Alternativa: HACS **Scheduler** card.

### Verze s helperem (nastavitelný čas z UI)

```yaml
# packages/automatizace.yaml
input_datetime:
  cas_ranni_kava:
    name: "Čas ranní kávy"
    has_date: false
    has_time: true

input_boolean:
  ranni_kava_povolena:
    name: "Ranní káva zapnuta"

automation:
  - alias: "Kávovar – ranní spuštění (nastavitelné)"
    id: jura_rano_helper
    trigger:
      - platform: time
        at: input_datetime.cas_ranni_kava
    condition:
      - condition: state
        entity_id: input_boolean.ranni_kava_povolena
        state: "on"
      - condition: time
        weekday: [mon, tue, wed, thu, fri]
    action:
      - service: script.jura_spustit
    mode: single
```

Na dashboard pak přidej `input_datetime.cas_ranni_kava` (picker) a přepínač
`input_boolean.ranni_kava_povolena` → uživatel řídí ranní kávu bez YAML.

## 5.3 Bonusové automatizace (doporučené)

### Noční ztlumení jasu iPadu / obrazovky

Nástěnný iPad v noci nemá svítit naplno. Pokud používáš HA app, jas obrazovky se
dá řídit přes senzory/služby companion appky, případně přes automatizaci scény
displeje. Jednodušší cesta: naplánovaný přechod na tmavé/tlumené téma večer.

### „Vše vypnout" při odchodu

```yaml
automation:
  - alias: "Odchod – zhasnout vše"
    trigger:
      - platform: state
        entity_id: group.rodina      # nebo device_tracker / zámek dveří
        to: "not_home"
    action:
      - service: script.vse_vypnout
```

### (Volitelně) Detekce stavu kávovaru přes spotřebu

Pokud přidáš měřicí zásuvku (Shelly Plus Plug S) k Juře:

```yaml
template:
  - binary_sensor:
      - name: "Jura vaří"
        unique_id: jura_vari
        state: "{{ states('sensor.jura_prikon') | float(0) > 200 }}"
        icon: mdi:coffee
```

→ na dashboardu ukáže „vaří / v klidu" a lze na to navázat notifikaci „káva
hotová".

## 5.4 Kde to vytvářet

- **Rychle a bez YAML:** Nastavení → *Automatizace a scény* → grafický editor
  (ukládá do `automations.yaml` / `scenes.yaml`).
- **Verzovaně a přehledně:** soubory v `packages/` jak výše (a `configuration.yaml`
  s `packages: !include_dir_named packages`).

Obojí lze kombinovat — jednorázové věci klikačkou, „páteř" systému v packages.
