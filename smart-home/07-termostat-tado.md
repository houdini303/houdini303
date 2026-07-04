# 07 — Termostat Tado v3+

Řízení topení a jeho zapojení do stejného dashboardu jako světla a kávovar.

## 7.1 Dvě cesty integrace — a proč záleží na „lokálně"

Tado v3+ (Internet Bridge + termostatické hlavice / termostat) jde do Home
Assistantu **dvěma způsoby**. Volba je důležitá kvůli filozofii projektu
(lokálně, bez závislosti na cloudu):

| Cesta | Lokální? | Náročnost | Poznámka |
|-------|----------|-----------|----------|
| **HomeKit Controller** (přes Tado bridge) | ✅ **ano, lokálně** | nízká–střední | **Doporučeno** — Tado bridge umí HomeKit; HA se s ním spáruje po LAN |
| **Oficiální integrace Tado** (cloud API) | ❌ ne (cloud) | nízká (klik) | funguje, ale závislé na internetu + **rate-limity** dotazů |

> **Rozhodnutí projektu:** primárně **HomeKit Controller** = lokální řízení a
> odečet teplot bez cloudu, v souladu se zbytkem systému. Cloudovou Tado
> integraci ber jako fallback nebo když potřebuješ funkce, které přes HomeKit
> nejsou vidět (např. některá data o počasí / plánech z Tado appky).

### ⚠️ Důležité upozornění: konflikt HomeKit vs. Tado app

Bridge lze v jednu chvíli typicky spárovat **buď** s HomeKit (a tím i s HA přes
HomeKit Controller), **nebo** ho necháš plně v Tado cloudu. Párování do HomeKit
může omezit/odpojit ovládání přes oficiální Tado appku (a naopak). **Rozmysli si
předem**, zda chceš:
- **A) Vše přes HA (doporučeno pro tento projekt)** — spáruj bridge do HomeKit a
  ovládej z HA/iPadu. Tado app pak používej minimálně.
- **B) Nechat Tado app + přidat cloud integraci** — pohodlné, ale závislé na
  internetu a méně „lokální".

Toto je bod, který doporučuji **potvrdit před nasazením** (viz checklist níže).

## 7.2 Postup — HomeKit Controller (doporučeno)

1. V HA: **Nastavení → Zařízení a služby → Přidat integraci → HomeKit Device**
   (HomeKit Controller). HA prohledá síť a najde Tado bridge (musí být na stejné
   LAN / dostupný přes mDNS — pozor na IoT VLAN, viz [`01`](01-architektura.md)).
2. Zadej **HomeKit párovací kód** (8místný, je na bridge / v krabici / v Tado app
   pod přidáním do Apple Home).
3. Po spárování vzniknou entity typu **`climate.*`** pro každou zónu/hlavici
   (např. `climate.obyvak`, `climate.loznice`) + čidla teploty/vlhkosti
   (`sensor.*`).
4. Přiřaď entity k **oblastem/místnostem** v HA, ať se hezky sdruží na dashboardu.

## 7.3 Postup — oficiální Tado integrace (cloud, fallback)

1. **Nastavení → Zařízení a služby → Přidat integraci → Tado**.
2. Přihlas se účtem Tado (OAuth). Vzniknou `climate.*` a řada senzorů (venkovní
   teplota, „home/away", vlhkost, otevřené okno…).
3. Počítej s **cloud latencí a rate-limity** — proto ne pro rychlé, časté akce.

## 7.4 Ovládání na dashboardu (iPad)

`climate` entity mají v HA připravenou kartu **Thermostat**. Na iPad doporučuji
buď nativní `thermostat` kartu, nebo kompaktní **Mushroom climate** dlaždici.

```yaml
# doplň do dashboards/ipad.yaml — nová sekce nebo nový pohled "Topení"
- type: grid
  cards:
    - type: heading
      heading: Topení
    - type: thermostat
      entity: climate.obyvak
      name: Obývák
    - type: custom:mushroom-climate-card
      entity: climate.loznice
      name: Ložnice
      hvac_modes:
        - heat
        - "off"
      show_temperature_control: true
```

> Pro nástěnný iPad je fajn mít samostatný **pohled „Topení"** se všemi zónami
> vedle sebe, plus rychlý přehled teplot na hlavní stránce (malé `sensor` dlaždice).

## 7.5 Scény a automatizace s topením

Termostat můžeš zapojit do scén i časových rutin — logicky sedí k ranní rutině
u kávovaru.

### Přidání teploty do scén

```yaml
# packages/sceny.yaml — rozšíření scény "Ráno"
scene:
  - name: "Ráno"
    id: rano
    entities:
      # ... světla ...
      climate.obyvak:
        state: heat
        temperature: 22
      climate.koupelna:
        state: heat
        temperature: 23        # koupelnu na ráno přitopit
```

### Ranní přitopení před probuzením (Po–Pá 6:30)

```yaml
# packages/automatizace.yaml
automation:
  - alias: "Topení – ranní přitopení (Po–Pá 6:30)"
    id: topeni_rano
    trigger:
      - platform: time
        at: "06:30:00"
    condition:
      - condition: time
        weekday: [mon, tue, wed, thu, fri]
    action:
      - service: climate.set_temperature
        target:
          entity_id: climate.obyvak
        data:
          temperature: 22
```

### Útlum při odchodu / v noci

```yaml
automation:
  - alias: "Topení – útlum při odchodu"
    trigger:
      - platform: state
        entity_id: group.rodina
        to: "not_home"
        for: "00:20:00"
    action:
      - service: climate.set_temperature
        target: {entity_id: [climate.obyvak, climate.loznice]}
        data: {temperature: 17}
```

> 💡 Tado má vlastní chytré funkce (geofencing, detekce otevřeného okna). Můžeš je
> nechat běžet v Tado, **nebo** je nahradit vlastní logikou v HA (pak vše řídíš
> lokálně z jednoho místa). Nemíchej obojí na stejnou zónu, ať si automatizace
> „nepřetahují" nastavení.

## 7.6 Checklist (doplněk k [`06`](06-postup-instalace.md))

- [ ] Rozhodnout **A vs. B** (HomeKit lokálně vs. Tado cloud) — viz upozornění 7.1
- [ ] Zjistit **HomeKit párovací kód** Tado bridge
- [ ] Bridge dostupný z hubu po LAN (mDNS napříč VLAN, pokud je IoT VLAN)
- [ ] Spárovat přes **HomeKit Controller**, pojmenovat zóny (`climate.<mistnost>`)
- [ ] Přiřadit zóny k oblastem, přidat kartu/pohled „Topení" na iPad
- [ ] Rozšířit scény o teploty, přidat ranní přitopení + útlum při odchodu
- [ ] Ověřit, že vytápění reaguje i při odpojeném internetu (test lokality)
