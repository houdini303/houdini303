// Sjednocené rozhraní pro "klienta" Home Assistantu.
// Existují dvě implementace se stejným API:
//   - realClient  → skutečné HA přes WebSocket (home-assistant-js-websocket)
//   - mockClient  → demo režim se simulovanými zařízeními (bez HA)
// Zbytek appky nezajímá, který z nich běží.

export interface HaEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
}

export type HaEntities = Record<string, HaEntity>;

export interface ServiceTarget {
  entity_id?: string | string[];
}

export interface HaClient {
  /** Přihlásí se k odběru stavů všech entit. Vrací funkci pro odhlášení. */
  subscribe(cb: (entities: HaEntities) => void): () => void;
  /** Zavolá službu HA (např. light.turn_on). */
  callService(
    domain: string,
    service: string,
    data?: Record<string, unknown>,
    target?: ServiceTarget,
  ): Promise<void>;
  /** Ukončí spojení / uklidí. */
  disconnect(): void;
}
