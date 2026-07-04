# 04 — Dashboard a kiosk pro nástěnný iPad

Cíl: intuitivní, „na dotek", karty místností + klíčové funkce (světla, kávovar,
scény), optimalizované pro rozlišení a poměr stran iPadu, běžící trvale v kiosku.

## 4.1 Návrhové zásady pro nástěnný iPad

- **Velké dotykové cíle** — prsty, ne myš. Dlaždice min. ~80–100 px.
- **Málo obrazovek, hodně přehledu** — ideálně 1 hlavní pohled + pár záložek
  (místnosti). Nenutit uživatele hledat.
- **Poměr stran:** iPad 4:3 (na výšku i šířku). Rozhodni orientaci držáku a
  navrhni layout na ni (většina nástěnných = **na šířku**, landscape).
- **Tmavé téma** šetří OLED/LCD a v noci neoslňuje; zvaž auto-jas / noční ztlumení
  (viz automatizace v [`05`](05-automatizace-sceny.md)).
- **Bez rušivých prvků** — skryj boční menu, hlavičku, „house" ikonu (kiosk-mode).

## 4.2 Doporučené HACS karty (přívětivé UI)

| Karta (HACS) | K čemu |
|--------------|--------|
| **Mushroom** | krásné, kompaktní dlaždice pro světla/scény/tlačítka — ideál na dotek |
| **card-mod** | doladění vzhledu (velikost fontu, zaoblení, barvy) |
| **kiosk-mode** | skryje menu a hlavičku → čistý kiosk uvnitř HA |
| **layout-card / grid** | přesné rozvržení do mřížky pro daný poměr stran |
| (volitelně) **Scheduler card** | ať jde ranní čas kávovaru měnit klikáním, ne YAML |

## 4.3 Struktura dashboardu

```
Dashboard "Domov"  (jeden Lovelace, YAML mód)
├── Pohled: Přehled        ← výchozí, nejčastější akce
│   ├── Řádek scén: [Vše vypnout] [Večerní relax] [Ráno] ...
│   ├── Karta KÁVOVAR: velké tlačítko "Uvařit kávu" (+ stav/spotřeba)
│   └── Rychlá světla: dlaždice hlavních místností (skupiny)
├── Pohled: Obývák         ← detail světel místnosti (jas, barva, pásek)
├── Pohled: Kuchyň
└── Pohled: Ložnice
```

## 4.4 Ukázkový Lovelace (YAML mód, s Mushroom)

> Nastav dashboard do **YAML módu** (Nastavení → Dashboardy → tři tečky → *Upravit
> v YAML*, nebo přes `dashboards/ipad.yaml`). Entity uprav podle svých názvů.

```yaml
# dashboards/ipad.yaml
title: Domov
views:
  - title: Přehled
    path: prehled
    type: sections          # moderní layout, dobře drží mřížku na iPadu
    sections:

      # --- SCÉNY ---
      - type: grid
        cards:
          - type: heading
            heading: Scény
          - type: custom:mushroom-template-card
            primary: Vše vypnout
            icon: mdi:power
            icon_color: red
            tap_action: {action: call-service, service: script.vse_vypnout}
          - type: custom:mushroom-template-card
            primary: Večerní relax
            icon: mdi:weather-night
            icon_color: deep-purple
            tap_action: {action: call-service, service: scene.turn_on, target: {entity_id: scene.vecerni_relax}}
          - type: custom:mushroom-template-card
            primary: Ráno
            icon: mdi:weather-sunny
            icon_color: amber
            tap_action: {action: call-service, service: scene.turn_on, target: {entity_id: scene.rano}}

      # --- KÁVOVAR ---
      - type: grid
        cards:
          - type: heading
            heading: Kávovar
          - type: custom:mushroom-template-card
            primary: Uvařit kávu
            secondary: "{{ states('sensor.jura_prikon') | default('') }}"
            icon: mdi:coffee
            icon_color: brown
            layout: vertical
            fill_container: true
            tap_action: {action: call-service, service: script.jura_spustit}

      # --- SVĚTLA / MÍSTNOSTI (skupiny) ---
      - type: grid
        cards:
          - type: heading
            heading: Světla
          - type: custom:mushroom-light-card
            entity: light.obyvak_vse
            name: Obývák
            show_brightness_control: true
            show_color_control: true
            use_light_color: true
          - type: custom:mushroom-light-card
            entity: light.kuchyn_vse
            name: Kuchyň
            show_brightness_control: true
          - type: custom:mushroom-light-card
            entity: light.loznice_vse
            name: Ložnice
            show_brightness_control: true
            show_color_temp_control: true

  # --- DETAIL MÍSTNOSTI: OBÝVÁK ---
  - title: Obývák
    path: obyvak
    type: sections
    sections:
      - type: grid
        cards:
          - type: heading
            heading: Obývák
          - type: custom:mushroom-light-card
            entity: light.obyvak_pasek
            name: LED pásek
            show_brightness_control: true
            show_color_control: true
            use_light_color: true
          - type: custom:mushroom-light-card
            entity: light.obyvak_hlavni
            name: Hlavní světlo
            show_brightness_control: true
          - type: custom:mushroom-light-card
            entity: light.obyvak_nocni
            name: Noční
            show_brightness_control: true
```

> Sekce `type: sections` se sama rozloží do sloupců podle šířky — na iPadu na
> šířku vyjde hezky do 2–3 sloupců. Pro pixel-perfect kontrolu použij
> `layout-card`/`grid` s pevným počtem sloupců.

## 4.5 Kiosk mód uvnitř HA (skrytí menu)

Přes HACS kartu **kiosk-mode**. V dashboardu (raw config) nahoře:

```yaml
kiosk_mode:
  hide_header: true
  hide_sidebar: true
```

Nebo cílit jen na uživatele „ipad" / dané zařízení (dokumentace kiosk-mode).
Tím z HA zmizí boční panel a horní lišta → zůstanou jen tvé karty.

## 4.6 Kiosk na straně iPadu (Guided Access)

Detailní postup (HA app, Guided Access, prevence uspání, auto-návrat) je v
[`06-postup-instalace.md`](06-postup-instalace.md) v sekci *iPad*. Ve zkratce:

1. Nainstaluj oficiální **Home Assistant** app, přihlas do lokální instance,
   otevři dashboard „Domov".
2. iOS → Nastavení → Zpřístupnění → **Guided Access** zapnout, dát kód.
3. Trojklik bočního tlačítka → spustí Guided Access → iPad je zamčený na HA app.
4. Nastav **Auto-Lock = Nikdy** (a ideálně napájení + řízení jasu přes automatizaci).
