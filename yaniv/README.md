# Yaniv – mobilní počítadlo

Co nejjednodušší mobilní aplikace pro počítání skóre v karetní hře **Yaniv**.
Jeden soubor, žádný build, žádné závislosti — stačí otevřít `index.html`
v mobilním prohlížeči (nebo nahrát kamkoli na web a přidat na plochu).

## Funkce

- Přidání hráčů podle jména
- Zápis bodů po každém kole, průběžné součty (od 80 bodů oranžově)
- Kdo dosáhne **100**, je venku — spustí se **BUSTED** obrazovka ve stylu GTA
  (zešednutí obrazovky, razítkování písmen, otřesy, vibrace) se zvukem
- Vrácení posledního kola (překlep), nová hra
- Skóre se ukládá do `localStorage` — přežije zavření prohlížeče

## Zvuk „busted"

Originální GTA zvuk nelze přibalit kvůli autorským právům. Aplikace proto:

1. zkusí přehrát soubor `busted.mp3`, pokud ho položíš vedle `index.html`
   (sem si můžeš dát vlastní zvuk),
2. jinak zvuk syntetizuje přes Web Audio API (údery + sestupný „fail" tón).
