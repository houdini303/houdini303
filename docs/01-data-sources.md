# Datové zdroje

Dokument shrnuje ověřené zdroje dat pro pardubickou MHD — jak statická
(jízdní řády, zastávky), tak real-time (aktuální poloha vozů).

---

## 1. Real-time poloha vozů (KLÍČOVÝ zdroj) ✅ ověřeno funkční

Zdroj je backend veřejné mapy DPMP **online.dpmp.cz** (mirror: `mhd.kacis.eu`),
což je stejný feed, ze kterého čerpá oficiální veřejná mapa. Není to formálně
otevřené API — je to interní endpoint frontendu, přístupný klíčem, který je
zadrátovaný ve veřejném JS buildu.

### Autentizace

Každý požadavek je `POST` s JSON tělem obsahujícím klíč:

```
POST https://online.dpmp.cz/api/<endpoint>
Content-Type: text/plain;charset=UTF-8      ← DŮLEŽITÉ (viz níže)
Origin: https://online.dpmp.cz

{"key":"3e86570d-56a1-4ec1-8012-c1a9f98d18cc"}
```

> ⚠️ **Content-Type gotcha:** server odpovídá `200` **pouze** při
> `Content-Type: text/plain;charset=UTF-8` (tak posílá `fetch()` textové tělo).
> S `application/json` nebo `x-www-form-urlencoded` vrací `500`. Bez klíče `401`.
> Toto byl jediný důvod, proč prvotní pokusy o replay selhávaly.

### Endpointy

| Endpoint | Metoda | Vrací |
|---|---|---|
| `api/lines` | POST | Seznam všech linek a jejich zastávek (statické) |
| `api/currentConnections?line=<N>` | POST | **Aktivní spoje na lince `N` vč. polohy vozu** |
| `api/codes` | POST | Číselník symbolů jízdního řádu (x = na znamení, …) |

Bulk endpoint „všechny vozy najednou" neexistuje → poloha se získává **iterací
přes všechny linky** (`api/lines` → čísla linek → `currentConnections` per linka).

### Schéma odpovědi `currentConnections`

```jsonc
[
  {
    "connection": {
      "line_number": 2,
      "number": 135,
      "stops": [
        { "number": 39, "name": "Polabiny,točna", "codes": [],
          "index": 0, "distance": 0,
          "arrivalTime": "", "departureTime": "0935", "platform": 1 }
        // …
      ]
    },
    "from": "09:35",
    "to": "09:51",
    "bus": {                                  // ← REAL-TIME poloha vozu
      "vid": "413",                           // ID vozu
      "state_dtime": "2026-07-02 07:41:30.837", // čas polohy (UTC)
      "line_name": "2",
      "line_direction": "S02",
      "destination_name": "Pardubičky,točna",
      "last_stop_number": "180",
      "last_stop_name": "Stavařov",
      "current_stop_number": "18701",
      "current_stop_name": "Sukova",
      "current_stop_scheduled_departure": "09:42:00",
      "time_difference": "00:00:52",          // zpoždění (+) / náskok (-)
      "connection_no": 135,
      "gps_latitude": 50.039165,              // ← SOUŘADNICE
      "gps_longitude": 15.770722
    }
  }
]
```

Pole `bus` je `null`, pokud spoj právě nevysílá polohu (ještě nevyjel / dojel).
`time_difference` může být `None`/`null` (neznámé zpoždění).

### Schéma `api/lines`

```jsonc
[
  { "number": 11,
    "stops": [ { "number": 35, "name": "Rybitví,Uma točna", "codes": [] }, … ] }
]
```

### Ověřený rozsah dat

- **33 linek**: 1–18, 20, 22–25, 27–30, 33, 88, 98, 99, 902, 906.
- Typicky **~18–40 vozů** v provozu podle denní doby.
- Každý vůz nese GPS, zpoždění, aktuální/minulou zastávku, cíl, časové razítko.

### Omezení a poznámky

- **CORS:** API **nevrací** `Access-Control-Allow-Origin`; preflight `OPTIONS`
  vrací `401`. → Z prohlížeče na cizí doméně **nelze volat přímo**. Nutná
  **serverová proxy** (viz architektura).
- **Kódování:** většina názvů chodí v UTF-8 správně, ale některá pole
  (`api/codes`) mají artefakty (`nedìli` místo `neděli`) — hlídat / případně
  překódovat z windows-1250.
- **Heading (natočení vozu):** API nedává azimut → počítá se z rozdílu dvou po
  sobě jdoucích poloh (pro natočení ikony na mapě).
- **Rate limiting:** nehamrat. Proxy má cachovat odpovědi ~5–10 s a agregovat
  volání všech linek na jeden refresh.

### Právní / etický kontext

- Jsou to data DPMP servírovaná přes jejich veřejnou appku, ne licencovaná
  „open data". Funguje to spolehlivě a je to identický zdroj jako oficiální mapa.
- Pro osobní/hobby PWA v pořádku. Pro komerční nebo dlouhodobě garantované
  nasazení doporučeno napsat DPMP o oficiální API klíč (i jako pojistku proti
  rotaci klíče / zablokování).

---

## 2. Statická data (GTFS) — zastávky, trasy, jízdní řády

### Dostupné zdroje

| Zdroj | Obsah | Poznámka |
|---|---|---|
| [tangero/jizdni-rady-czech-republic](https://github.com/tangero/jizdni-rady-czech-republic) | Agregovaný GTFS celé ČR vč. Pardubic | Znečištěný (anonymizované agentury, trolejbusy jako `route_type=3`), ale použitelný pro zastávky/linky |
| CHAPS `KOMPLET.ZIP` (CIS JŘ) | Autoritativní celostátní JŘ | Právně citlivé — CHAPS si nárokuje práva na převody |
| [xaralis/dpmp-gtfs](https://github.com/xaralis/dpmp-gtfs) | Čistý GTFS + GTFS-RT pro Pardubice | Vyžaduje API klíč od DPMP |

### Co je vytaženo

Z agregovaného GTFS vyfiltrováno **~198 zastávek** pardubické oblasti s názvy a
GPS souřadnicemi (soubor `data/pardubice_stops.csv`). Příklady:

```
Pardubice, Dubina, centrum   50.0449, 15.8067
Pardubice, k nemocnici       50.0315, 15.7897
Pardubice, Černá za Bory     50.0257, 15.8230
```

### Poznámka k pokrytí

Real-time endpoint `api/lines` dává vlastní seznam zastávek per linka (s názvy),
takže pro MVP **statický GTFS ani nemusí být nutný** — zastávky i trasy linek
lze poskládat z `api/lines`. GTFS je užitečný pro přesné tvary tras (shapes) a
plné jízdní řády.
