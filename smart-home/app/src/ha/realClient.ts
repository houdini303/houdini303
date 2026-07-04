import {
  createConnection,
  createLongLivedTokenAuth,
  subscribeEntities,
  callService,
  type Connection,
  type HassEntities,
} from 'home-assistant-js-websocket';
import type { HaClient, HaEntities, ServiceTarget } from './types';

// Připojení ke skutečnému Home Assistantu přes jeho WebSocket API.
// URL je základ instance, např. "https://ha.doma.lan" nebo "http://homeassistant.local:8123".
// Token = Long-Lived Access Token (HA → profil → dole).
export async function createRealClient(url: string, token: string): Promise<HaClient> {
  const auth = createLongLivedTokenAuth(url.replace(/\/+$/, ''), token);
  const connection: Connection = await createConnection({ auth });

  return {
    subscribe(cb) {
      // subscribeEntities dodává HassEntities; náš HaEntities je strukturálně kompatibilní.
      return subscribeEntities(connection, (ents: HassEntities) => cb(ents as unknown as HaEntities));
    },
    async callService(domain, service, data, target?: ServiceTarget) {
      await callService(connection, domain, service, data, target);
    },
    disconnect() {
      connection.close();
    },
  };
}
