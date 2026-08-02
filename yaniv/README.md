# Yaniv – mobilní počítadlo (PWA)

Jednoduchá mobilní aplikace pro počítání skóre v karetní hře **Yaniv**.
Žádný build, žádné závislosti — funguje rovnou z `index.html`. Nasazená
na webu se chová jako PWA: jde přidat na plochu a funguje offline.

## Funkce

- Přidání hráčů podle jména, zápis bodů po každém kole
- **Yaniv/Asaf** bodování podle standardních pravidel (viz níže)
- **Tabulka historie**: řádky = kola, sloupce = hráči, badge Y / Y+30 / A,
  halvace a součty; průběžný součet od 80 bodů oranžově
- Kdo dosáhne **100**, je venku — spustí se **BUSTED** sekvence ve stylu
  GTA San Andreas: pixel-art honička (jezdec na krosce ujíždí, policejní
  auto ho odstaví), siréna, orchestrální údery, razítkování textu
  „BUSTED, VOLE, BUSTED", otřesy a vibrace
- Vrácení posledního kola, nová hra (potvrzení dvojím ťuknutím)
- Skóre se ukládá do `localStorage` (v sandboxu bez úložiště běží v paměti)

## Pravidla bodování (zdroj: [pagat.com](https://www.pagat.com/draw/yaniv.html), [Wikipedia](https://en.wikipedia.org/wiki/Yaniv_(card_game)))

- Kolo končí, když hráč s rukou ≤ 5 bodů zavolá **Yaniv**.
- **Úspěšný Yaniv** (volající má opravdu nejméně): volající **0 bodů**,
  ostatní si zapíší hodnotu svých karet.
- **Asaf**: má-li jiný hráč stejně nebo méně, přebije volajícího — volající
  dostane **svou ruku + 30 trestných**, všichni ostatní (včetně přebíjejícího)
  si zapíší své karty.
- Přistane-li součet hráče **přesně na 50, snižuje se na 25**.
- Hráč, který dosáhne **100 bodů, vypadává** (BUSTED). Pozn.: izraelská
  verze hraje do 200 s halvací 100→50; tato aplikace používá kratší
  variantu do 100 (hraje se tak např. v Nepálu jako „Jhyap").

V aplikaci: každému zapiš hodnotu ruky, volajícímu označ **Yaniv**;
pokud byl přebit, označ přebíjejícímu **Asaf** — +30 se přičte automaticky.

## Zvuk „busted"

Originální GTA zvuk nelze přibalit kvůli autorským právům. Aplikace proto:

1. zkusí přehrát soubor `busted.mp3`, pokud ho položíš vedle `index.html`
   (sem si můžeš dát vlastní zvuk),
2. jinak zvuk syntetizuje přes Web Audio API (siréna + údery).

## Soubory

- `index.html` — celá aplikace (UI + logika)
- `manifest.webmanifest`, `sw.js`, `icon-192.png`, `icon-512.png` — PWA
  (manifest, offline cache, ikony)
