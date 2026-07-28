# 🇮🇹 Mapa bezpečnosti Itálie — nemovitosti & ulice

Interaktivní kartogram hlášené kriminality ve všech 106 italských provinciích
(včetně Sicílie a Sardinie). Jediný samostatný soubor — `index.html` stačí
otevřít v prohlížeči, žádné závislosti ani síťové požadavky.

## Pohledy

| Pohled | Složení (na 100 000 obyvatel, 2024) |
|---|---|
| 🏠 **Riziko pro nemovitost** | vloupání do obydlí (furti in abitazione) + loupeže v obydlí (rapine in abitazione) |
| 🚶 **Riziko na ulici** | kapesní krádeže (furti con destrezza) + krádeže se strhnutím (furti con strappo) + loupeže na veřejné komunikaci |
| Σ **Celková kriminalita** | souhrnný index všech hlášených trestných činů |
| Jednotlivé činy | vloupání, loupeže v obydlí, kapesní krádeže, scippo, pouliční loupeže, loupeže celkem, krádeže aut, vydírání, vraždy, podvody |

Funkce: hover tooltip, klik → kompletní profil provincie (13 ukazatelů +
pořadí mezi 106 provinciemi), fulltextové hledání, zoom kolečkem/tažením,
rychlé zoomy (Sever/Střed/Jih/Sicílie/Sardinie), kvantilová legenda,
žebříčky top/bottom 10, tmavý režim.

## Data

- **Kriminalita:** Ministero dell'Interno — trestné činy oznámené policejními
  složkami soudní moci za rok 2024, po provinciích, publikováno v
  [Indice della criminalità 2025 (Il Sole 24 Ore / lab24)](https://lab24.ilsole24ore.com/indice-della-criminalita/).
- **Hranice provincií:** ISTAT — Confini delle unità amministrative,
  zjednodušená geometrie via [openpolis/geojson-italy](https://github.com/openpolis/geojson-italy)
  (Douglas-Peucker, tol. 0,008°).
- Provincie Sud Sardegna nemá v policejních statistikách vlastní řadu (n.d.).

### Interpretační upozornění

Jde o **oznámenou** kriminalitu: na jihu (Kalábrie, Kampánie, části Sicílie)
je podle ISTAT vyšší latentní kriminalita, turistická centra mají naopak čísla
nadsazená (činy na turistech / přepočet jen na rezidenty).

## Obnova dat

Data se stahují z veřejného API lab24
(`.../classifica/prc/uti.php?a=cambia-classifica&IDindicatore=<ID>&anno=<rok>`)
pro indikátory 123, 112, 262, 110, 111, 335, 116, 114, 117, 106, 122 a vkládají
se do `index.html` jako konstanty `GEO` a `DATA`.
