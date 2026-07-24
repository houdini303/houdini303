#!/usr/bin/env node
// Multi-account IMAP inbox-summary MCP server.
//
// Exposes read-only tools over stdio so Claude Code (e.g. a daily routine) can
// pull an inbox summary across several IMAP mailboxes at once. No message is
// ever modified, deleted or marked as read — messages are fetched with the
// IMAP PEEK semantics that imapflow uses for envelope/flags reads.
//
// Configuration lives in a JSON file kept OUTSIDE git (see accounts.example.json).
// Point to it with EMAIL_ACCOUNTS_FILE, or drop an accounts.json next to this file.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ImapFlow } from "imapflow";
import { z } from "zod";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Config loading
// ---------------------------------------------------------------------------

/**
 * Load account config from (in order of precedence):
 *   1. EMAIL_ACCOUNTS_JSON  — inline JSON string
 *   2. EMAIL_ACCOUNTS_FILE  — path to a JSON file
 *   3. ./accounts.json      — next to this script
 *
 * Shape:
 *   {
 *     "defaults": { "host": "imap.websupport.cz", "port": 993, "secure": true },
 *     "accounts": [ { "email": "...", "user": "...", "password": "...", "host"?: "..." } ]
 *   }
 */
function loadConfig() {
  let raw;
  if (process.env.EMAIL_ACCOUNTS_JSON) {
    raw = process.env.EMAIL_ACCOUNTS_JSON;
  } else {
    const path = process.env.EMAIL_ACCOUNTS_FILE
      ? resolve(process.env.EMAIL_ACCOUNTS_FILE)
      : resolve(__dirname, "accounts.json");
    raw = readFileSync(path, "utf8");
  }

  const parsed = JSON.parse(raw);
  const defaults = parsed.defaults ?? {};
  const accounts = (parsed.accounts ?? []).map((a) => ({
    email: a.email,
    label: a.label ?? a.email,
    host: a.host ?? defaults.host ?? "imap.websupport.cz",
    port: a.port ?? defaults.port ?? 993,
    secure: a.secure ?? defaults.secure ?? true,
    user: a.user ?? a.email,
    password: a.password ?? "",
  }));

  if (accounts.length === 0) {
    throw new Error("No accounts configured (see accounts.example.json).");
  }
  return accounts;
}

// ---------------------------------------------------------------------------
// IMAP read
// ---------------------------------------------------------------------------

function fmtAddr(list) {
  if (!Array.isArray(list) || list.length === 0) return "";
  return list
    .map((a) => (a.name ? `${a.name} <${a.address}>` : a.address))
    .join(", ");
}

/**
 * Fetch a lightweight summary of one mailbox.
 * @returns {Promise<object>} { account, ok, unreadTotal?, messages?, error? }
 */
async function summariseAccount(acct, { unreadOnly, limit, sinceDays }) {
  const client = new ImapFlow({
    host: acct.host,
    port: acct.port,
    secure: acct.secure,
    auth: { user: acct.user, pass: acct.password },
    logger: false,
    // Fail fast rather than hang a routine on an unreachable/wrong host.
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      const criteria = {};
      if (unreadOnly) criteria.seen = false;
      if (sinceDays && sinceDays > 0) {
        const since = new Date(Date.now() - sinceDays * 86400000);
        criteria.since = since;
      }
      // search with no criteria returns all; imapflow accepts {} as "ALL"
      const uids = await client.search(
        Object.keys(criteria).length ? criteria : { all: true },
        { uid: true }
      );

      const unreadTotal = unreadOnly
        ? uids.length
        : (await client.search({ seen: false }, { uid: true })).length;

      // Newest first, capped at `limit`.
      const pick = uids.slice(-limit).reverse();
      const messages = [];
      if (pick.length) {
        for await (const msg of client.fetch(
          pick,
          { envelope: true, flags: true, internalDate: true },
          { uid: true }
        )) {
          const env = msg.envelope ?? {};
          messages.push({
            from: fmtAddr(env.from),
            subject: env.subject ?? "(bez předmětu)",
            date: (env.date ?? msg.internalDate ?? "").toString(),
            unread: !(msg.flags && msg.flags.has("\\Seen")),
          });
        }
      }

      return {
        account: acct.email,
        ok: true,
        unreadTotal,
        shown: messages.length,
        messages,
      };
    } finally {
      lock.release();
    }
  } catch (err) {
    return {
      account: acct.email,
      ok: false,
      error: err && err.message ? err.message : String(err),
    };
  } finally {
    try {
      await client.logout();
    } catch {
      /* ignore */
    }
  }
}

function renderText(results, opts) {
  const lines = [];
  const scope = opts.unreadOnly ? "nepřečtené" : "poslední";
  lines.push(`# Souhrn schránek (${scope}, max ${opts.limit}/účet)`);
  lines.push("");
  for (const r of results) {
    if (!r.ok) {
      lines.push(`## ${r.account} — ⚠️ chyba: ${r.error}`);
      lines.push("");
      continue;
    }
    lines.push(`## ${r.account} — ${r.unreadTotal} nepřečtených`);
    if (r.messages.length === 0) {
      lines.push("_žádné zprávy_");
    } else {
      for (const m of r.messages) {
        const dot = m.unread ? "●" : "○";
        lines.push(`- ${dot} **${m.subject}** — ${m.from} _(${m.date})_`);
      }
    }
    lines.push("");
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// MCP server
// ---------------------------------------------------------------------------

async function main() {
  // Quick connectivity self-test: `node server.mjs --check`
  if (process.argv.includes("--check")) {
    const accounts = loadConfig();
    const results = await Promise.all(
      accounts.map((a) => summariseAccount(a, { unreadOnly: true, limit: 3 }))
    );
    console.log(renderText(results, { unreadOnly: true, limit: 3 }));
    process.exit(results.every((r) => r.ok) ? 0 : 1);
  }

  const server = new McpServer({ name: "email-inbox", version: "1.0.0" });

  server.registerTool(
    "inbox_summary",
    {
      title: "Inbox summary",
      description:
        "Přečte přehled schránek přes IMAP (více účtů najednou) a vrátí souhrn " +
        "odesílatel/předmět/datum. Pouze čte — nic neoznačuje ani nemaže.",
      inputSchema: {
        unread_only: z
          .boolean()
          .default(true)
          .describe("Jen nepřečtené zprávy (true) vs. poslední doručené (false)."),
        limit_per_account: z
          .number()
          .int()
          .min(1)
          .max(50)
          .default(10)
          .describe("Kolik nejnovějších zpráv vypsat na účet."),
        since_days: z
          .number()
          .int()
          .min(1)
          .max(365)
          .optional()
          .describe("Volitelně jen zprávy z posledních N dní."),
        accounts: z
          .array(z.string())
          .optional()
          .describe("Volitelný filtr na konkrétní e-maily; jinak všechny."),
      },
    },
    async (args) => {
      const all = loadConfig();
      const wanted =
        args.accounts && args.accounts.length
          ? all.filter((a) => args.accounts.includes(a.email))
          : all;
      const opts = {
        unreadOnly: args.unread_only ?? true,
        limit: args.limit_per_account ?? 10,
        sinceDays: args.since_days,
      };
      const results = await Promise.all(
        wanted.map((a) => summariseAccount(a, opts))
      );
      return {
        content: [
          { type: "text", text: renderText(results, opts) },
          {
            type: "text",
            text: "```json\n" + JSON.stringify(results, null, 2) + "\n```",
          },
        ],
      };
    }
  );

  server.registerTool(
    "list_accounts",
    {
      title: "List configured mailboxes",
      description:
        "Vypíše nakonfigurované schránky (bez hesel) — pro kontrolu nastavení.",
      inputSchema: {},
    },
    async () => {
      const accounts = loadConfig().map((a) => ({
        email: a.email,
        host: a.host,
        port: a.port,
        secure: a.secure,
      }));
      return {
        content: [
          { type: "text", text: JSON.stringify(accounts, null, 2) },
        ],
      };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("email-mcp fatal:", err);
  process.exit(1);
});
