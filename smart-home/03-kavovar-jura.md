# 03 — Automatizace kávovaru Jura

## 3.1 Problém a princip řešení

**Situace:** Jura je trvale pod proudem (tlačítko ON svítí červeně i v klidu).
Zapnutí = **krátké fyzické stisknutí** tlačítka na přístroji. Nejde tedy jen
„pustit napájení" — to by nefungovalo (a u některých Jur by to ani nezaplo, jen
by to blikalo/varovalo).

**Princip:** paralelně k fyzickému spínači zapojíme **Wi-Fi relé s bezpotenciálovým
(suchým) kontaktem**, které na povel z HA **sepne na ~300–500 ms a zase rozepne**
— čímž elektricky „zmáčkne" totéž, co palec. Tomu se říká **pulzní / momentární**
spínání.

```
        ┌───────────────────────┐
        │        JURA           │
        │  [ tlačítko ON ]──┐    │
        │        │          │    │   relé je zapojené PARALELNĚ
        │        │          │    │   k tlačítku (suchý kontakt)
        └────────┼──────────┼────┘
                 │          │
              ┌──┴──────────┴──┐
              │  Wi-Fi relé    │   pulz 300 ms = "stisk"
              │  (Shelly Plus 1)│
              └────────────────┘
```

> ⚠️⚠️ **BEZPEČNOST — PŘEČTI CELÉ.** Uvnitř kávovaru může být **230 V AC**.
> Jakýkoli zásah do vnitřního zapojení Jury **musí provést kvalifikovaná osoba
> (elektrikář)**. Špatné zapojení = riziko úrazu, požáru a zničení přístroje +
> ztráta záruky. Tato dokumentace popisuje **softwarovou** část a princip; fyzické
> zapojení nech na odborníkovi. Před prací vždy **odpoj přístroj od sítě**.

## 3.2 Volba relé — proč Shelly Plus 1

Klíčové je, že relé umí **bezpotenciálový (suchý) kontakt** — spíná jen dvojici
kontaktů tlačítka, galvanicky odděleně od svého napájení.

| Relé | Suchý kontakt | Lokální ovládání | Poznámka |
|------|---------------|------------------|----------|
| **Shelly Plus 1** | ✅ ano (svorky **SW/O** / bezpotenciálový režim) | ✅ nativní lokální API + HA integrace | **Doporučeno** |
| Sonoff MINIR3 / MINI | částečně (spíná napájení, ne vždy suchý kontakt) | ✅ přes ESPHome/Tasmota flash | jde, ale zapojení k tlačítku méně přímočaré |

**Doporučení: Shelly Plus 1** — má režim bezpotenciálového kontaktu (potřebuje
vlastní napájení, ale spínané kontakty jsou oddělené), skvělou lokální integraci
do HA (autodiscovery) a nevyžaduje cloud.

### Napájení a umístění relé

- Shelly Plus 1 lze napájet 12–30 V DC nebo 110–230 V AC — vyřeš s elektrikářem
  podle toho, co je uvnitř/u přístroje k dispozici, **nebo** relé napájej ze
  samostatného malého zdroje a k Juře veď jen dva vodiče suchého kontaktu.
- Relé může být schované v přístroji nebo v malé krabičce vedle něj.

## 3.3 Softwarová integrace v Home Assistantu

### Krok A — přidat relé do HA

- **Shelly:** po zapojení a připojení na (IoT) Wi-Fi ho HA **automaticky objeví**
  (integrace *Shelly*, lokální). Vznikne entita typu `switch.jura_rele`
  (u Shelly to bývá `switch.<jmeno>` nebo přepínač komponenty).
- **Sonoff (přes ESPHome):** definuješ `switch` v ESPHome konfiguraci → objeví se
  jako `switch.jura_rele`.

> Dej relé jednoznačné jméno, ať se ti neplete: `switch.jura_rele`.

### Krok B — pulzní logika (simulace stisku)

Relé nechceme nechat trvale sepnuté — chceme **krátký impuls**. To vyřešíme
`scriptem`, který sepne a po chvíli rozepne. Uživatel/dashboard pak volá script,
ne přímo relé.

```yaml
# packages/kavovar.yaml
script:
  jura_spustit:
    alias: "Jura – spustit (pulz)"
    icon: mdi:coffee-maker
    mode: single          # neběží dvakrát naráz
    sequence:
      - service: switch.turn_on
        target:
          entity_id: switch.jura_rele
      - delay:
          milliseconds: 400        # délka "stisku" – dolaď dle přístroje (300–600 ms)
      - service: switch.turn_off
        target:
          entity_id: switch.jura_rele
```

> 💡 Ještě čistší je nastavit **auto-off přímo na Shelly** (v nastavení relé
> „Auto OFF po 0,4 s"). Pak i kdyby HA vypadl uprostřed, relé se samo rozepne a
> tlačítko nezůstane „drženo". Doporučuji **oba pojistky** (Shelly auto-off +
> script `turn_off`).

### Krok C — tlačítko pro dashboard/UI

Aby to na iPadu bylo „jedno velké tlačítko", přidáme `button` entitu, která jen
zavolá script:

```yaml
# packages/kavovar.yaml  (pokračování)
template:
  - button:
      - name: "Uvařit kávu"
        unique_id: jura_uvarit_kavu
        icon: mdi:coffee
        press:
          - service: script.jura_spustit
```

Na dashboardu pak dáš `button.uvarit_kavu` jako výraznou dlaždici (viz
[`04-dashboard-ipad.md`](04-dashboard-ipad.md)).

## 3.4 Časové rutiny (např. pracovní dny v 7:00)

Viz [`05-automatizace-sceny.md`](05-automatizace-sceny.md) — automatizace, která
každý všední den v 7:00 zavolá `script.jura_spustit`.

## 3.5 Poznámky a limity, které je fér přiznat

- **Jednotlačítkové Jury:** pulz zapne přístroj. Pokud chceš, aby po zahřátí
  rovnou uvařil kávu, je to složitější — některé modely to bez „macro" tlačítka
  neumí přes jeden vstup. Pak zvaž více relé (pro více tlačítek) nebo doplnění
  o Bluetooth/UART hack (mimo rozsah tohoto plánu).
- **Zpětná vazba o stavu:** relé „naslepo" neví, jestli je Jura opravdu zapnutá.
  Chceš-li jistotu, přidej měření spotřeby (chytrá zásuvka s měřením, např.
  Shelly Plus Plug S) → z příkonu odvodíš „ohřívá / hotovo / vypnuto" a můžeš to
  ukázat na dashboardu i použít v automatizaci (viz nápad v [`05`](05-automatizace-sceny.md)).
- **Bezpečnost provozu:** zvaž, zda nechávat automatické ranní spouštění, když
  není nikdo doma / bez vody či zásobníku. Přidej podmínku přítomnosti nebo
  potvrzení.
