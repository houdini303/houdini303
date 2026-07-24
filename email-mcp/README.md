# email-mcp — souhrn více schránek přes IMAP

Malý **MCP server** (stdio), který přes IMAP přečte přehled několika schránek
najednou a vrátí souhrn (odesílatel / předmět / datum / nepřečteno). Slouží jako
**nástroj pro Claude Code** — např. v denní routine: _„projdi mi schránky a udělej
souhrn"_.

Je **read-only** — nic neoznačuje jako přečtené, nemaže, neodesílá. Čte jen
hlavičky zpráv (envelope + flags).

## Účty

Nastavené jsou schránky na Websupportu (`imap.websupport.cz`):

- `filip@weelet.cz`, `info@weelet.cz`, `develop@weelet.cz`, `socials@weelet.cz`
- `hudetz@revvit.cz`, `info@revvit.cz`

## Nastavení (jednorázově)

```bash
cd email-mcp
npm install

# vytvoř config s hesly (accounts.json je v .gitignore, necommituje se)
cp accounts.example.json accounts.json
# → do accounts.json doplň heslo ke každé schránce
```

> **Hesla:** ve Websupport administraci si u každé schránky ideálně vytvoř
> samostatné mailové heslo. `accounts.json` zůstává jen lokálně.
> Pokud by se IMAP host lišil, uprav `host` v configu (ověříš ve Websupport
> webmailu → nastavení IMAP/SMTP).

## Ověření, že to čte

```bash
npm run check
```

Připojí se ke všem schránkám a vypíše nepřečtené (nebo u chybné schránky důvod).

## Zapojení do Claude Code

V kořeni repa je [`.mcp.json`](../.mcp.json), které tento server registruje jako
`email-inbox`. Claude Code ho načte automaticky (potvrď důvěru serveru při první
výzvě). Pak stačí v routine napsat třeba:

> _Zavolej `inbox_summary` (unread_only) a udělej mi stručný přehled napříč všemi schránkami._

### Nástroje

| Nástroj | Co dělá | Parametry |
|---|---|---|
| `inbox_summary` | Souhrn napříč schránkami | `unread_only` (def. true), `limit_per_account` (def. 10), `since_days?`, `accounts?` (filtr e-mailů) |
| `list_accounts` | Vypíše nakonfigurované schránky (bez hesel) | — |

## Poznámky

- Config lze místo souboru předat i inline přes `EMAIL_ACCOUNTS_JSON`, nebo
  ukázat na jiný soubor přes `EMAIL_ACCOUNTS_FILE`.
- Server je záměrně bez build kroku (čisté ESM `server.mjs`, Node ≥ 18), ať běží
  spolehlivě i v headless routine.
