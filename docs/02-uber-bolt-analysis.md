# Analýza Uber / Bolt — UX & UI vzory

Cíl: postavit appku „přesně v jejich stylu". Tento dokument rozebírá, co dělá
Uber/Bolt appky charakteristické, a mapuje každý vzor na naši MHD appku.

---

## 1. Základní kompoziční princip: „mapa je aplikace"

U Uber/Bolt je **celoobrazovková mapa hlavní a jediná primární plocha**. Veškerý
obsah se vrství **nad** mapou, mapa nikdy nezmizí. Uživatel má pořád prostorový
kontext „kde jsem a co se kolem děje".

- Mapa = fullscreen, edge-to-edge, pod status barem i home indikátorem.
- Žádná klasická navigace nahoře (žádný header s titulkem). Chrome je minimální.
- Ovládací prvky **plavou** nad mapou (floating buttons, karty, sheety).

➡️ **U nás:** fullscreen mapa Pardubic s pohyblivými vozy MHD. Vše ostatní
(seznam linek, detail vozu, odjezdy) je overlay nad mapou.

---

## 2. Bottom sheet — srdce interakce

Nejcharakterističtější prvek. **Tažitelný spodní panel** ve 3 stavech (snap
points):

| Stav | Výška | Obsah |
|---|---|---|
| Peek (collapsed) | ~15 % | Search bar / hlavní CTA, náznak obsahu |
| Half | ~45 % | Seznam (nabídky jízd / linky / zastávky) |
| Full | ~90 % | Detail, plný scrollovatelný obsah |

Vlastnosti: zaoblené horní rohy, „grabber" (táhlo) nahoře, plynulé spring
animace, gesta táhnutím, backdrop dim při full stavu, obsah uvnitř scrolluje až
po plném roztažení.

➡️ **U nás:**
- **Peek:** vyhledávací pole „Kam / která linka?" + počet vozů v provozu.
- **Half:** seznam linek (s barvami) nebo nejbližší zastávky.
- **Full:** detail linky (všechny zastávky + živé vozy) nebo detail zastávky
  (tabule odjezdů) nebo detail vozu.

---

## 3. Živá mapa a pohyblivé markery

To, co dělá Uber „živým":

- **Vozidla jako ikony** (auto u Uberu) rozmístěná na mapě, **natočená podle
  směru jízdy** (heading/bearing).
- **Plynulý pohyb:** markery se mezi aktualizacemi polohy **interpolují**
  (animují) po plynulé dráze, ne skokově. Klíčové pro „premium" pocit.
- **Auto-refresh** polohy na pozadí (Uber ~každých pár s), bez blikání.
- Chytré **shlukování** (clustering) při odzoomování.
- Při výběru: mapa **plynule přejede a přizoomuje** (fly-to) na objekt.

➡️ **U nás:**
- Vozy MHD jako ikony (odlišit trolejbus/bus), **natočené podle vypočteného
  azimutu** (z rozdílu dvou poloh — API azimut nedává).
- **Interpolace** mezi 10–15 s aktualizacemi → vozy jedou plynule, ne poskakují.
- Barva markeru dle linky; badge s číslem linky.
- Tap na vůz → fly-to + otevře detail v bottom sheetu.

---

## 4. Vizuální jazyk (design tokens)

Co dělá „ten look":

- **Mapa:** vlastní minimalistický styl. Uber má charakteristickou **tmavou/
  desaturovanou mapu** (v noci tmavou), s potlačenými barvami, aby vynikly
  markery a trasy. Bolt používá čistou světlou mapu s výraznou zelenou.
- **Barvy:** jedna silná akcentní barva (Uber černá/bílá, Bolt zelená
  `#34D186`). Vysoký kontrast, hodně bílého/negativního prostoru.
- **Typografie:** tučné, velké nadpisy (ETA, cena), jasná hierarchie. Uber Move
  / Bolt vlastní grotesk. Čísla jsou hrdinové (ETA, zpoždění, čas).
- **Tvary:** velké **zaoblené rohy** (16–28 px) na kartách, sheetech, tlačítkách.
- **Elevace:** jemné stíny, vrstvení (mapa → sheet → floating buttons → toasty).
- **Ikony:** plné, jednoduché, konzistentní sada.
- **Prázdný prostor** a klid — nikdy ne přeplácané.

➡️ **U nás:** tmavá desaturovaná mapa (Uber-like) jako default + light varianta,
jedna akcentní barva (odvodíme z brandingu DPMP / vlastní), tučná čísla pro
zpoždění a čas, zaoblené sheety a karty.

---

## 5. Vyhledávání & vstup

- Uber/Bolt začíná **„Where to?"** polem v peek sheetu — jeden dominantní vstup.
- Po tapu → full sheet s našeptávačem, historie, uložená místa.

➡️ **U nás:** pole „Linka / zastávka" → našeptávač linek a zastávek; rychlé
chipy (oblíbené linky, nejbližší zastávka).

---

## 6. Detailové karty & stav v reálném čase

- Uber jízda: karta s **ETA jako hero číslem**, řidič, vůz, mapa s pohybem,
  progress.
- Neustálý **real-time status** („Auto je za 3 min", „Přijíždí").
- Prominentní **ETA / odpočty**.

➡️ **U nás:**
- **Detail vozu:** linka + cíl, **zpoždění jako hero** (barevně: zelená=včas,
  oranžová/červená=zpoždění), aktuální a příští zastávka, seznam zbývajících
  zastávek s časy, ID vozu.
- **Detail zastávky:** tabule odjezdů „za X min" (živě z poloh vozů), řazená.
- **Detail linky:** trasa + všechny vozy na lince živě.

---

## 7. Floating ovládání

- Uber/Bolt: **„lokalizuj mě"** (recenter) tlačítko vpravo dole nad sheetem,
  případně přepínač vrstev, tlačítko zpět jako plovoucí kolečko.

➡️ **U nás:** recenter na moji polohu, přepínač linek/filtr, přepínač
světlé/tmavé mapy.

---

## 8. Pohyb, přechody, mikrointerakce

- **Spring** animace (ne lineární), fyzikální pocit u sheetů a fly-to.
- **Skeletony** místo spinnerů při načítání.
- **Haptika** u klíčových akcí (na mobilu).
- Jemné **pulzování** živých prvků (např. „live" tečka).
- Nikdy prázdná obrazovka — vždy něco, na co kliknout.

---

## 9. PWA / mobile-first specifika

Aby to bylo „jako nativní appka" v prohlížeči:

- **Instalovatelná PWA** (manifest, ikony, splash), fullscreen `display:
  standalone`.
- **Safe-area insets** (notch, home indikátor) — `env(safe-area-inset-*)`.
- Touch-first gesta, velké tap targety (min 44 px).
- **Offline shell** (service worker) — appka se otevře i bez sítě, data se
  dolejí.
- Rychlý první paint, žádné layout shifty.

---

## 10. Co si z toho bereme — shrnutí priorit

Pořadí důležitosti pro „ten pocit":

1. **Fullscreen mapa + bottom sheet** kompozice.
2. **Plynulé pohyblivé vozy** (interpolace + natočení) — největší „wow".
3. **Tmavá desaturovaná mapa** + jedna akcentní barva + tučná čísla.
4. **Detail vozu/zastávky** se zpožděním/ETA jako hero.
5. **Spring animace, skeletony, PWA polish** (safe-area, instalace).

Tyto principy řídí architekturu a plán v `03-architecture-and-plan.md`.
