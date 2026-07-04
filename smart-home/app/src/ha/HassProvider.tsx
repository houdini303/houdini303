import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { loadConfig, saveConfig as persist, type AppConfig } from '../config';
import { createMockClient } from './mockClient';
import { createRealClient } from './realClient';
import type { HaClient, HaEntities, ServiceTarget } from './types';

export type ConnStatus = 'demo' | 'connecting' | 'connected' | 'error';

interface HassContextValue {
  status: ConnStatus;
  error?: string;
  entities: HaEntities;
  config: AppConfig;
  saveConfig: (c: AppConfig) => void;
  callService: (
    domain: string,
    service: string,
    data?: Record<string, unknown>,
    target?: ServiceTarget,
  ) => Promise<void>;
}

const HassContext = createContext<HassContextValue | null>(null);

export function HassProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(() => loadConfig());
  const [status, setStatus] = useState<ConnStatus>('connecting');
  const [error, setError] = useState<string | undefined>();
  const [entities, setEntities] = useState<HaEntities>({});
  const clientRef = useRef<HaClient | null>(null);

  // (Znovu)naváže spojení při každé změně konfigurace.
  useEffect(() => {
    let cancelled = false;
    let unsub: (() => void) | undefined;

    async function connect() {
      setError(undefined);
      setEntities({});

      // Demo režim, nebo chybějící údaje → mock klient.
      if (config.demo || !config.hassUrl || !config.token) {
        const client = createMockClient();
        clientRef.current = client;
        unsub = client.subscribe((e) => !cancelled && setEntities(e));
        setStatus('demo');
        return;
      }

      setStatus('connecting');
      try {
        const client = await createRealClient(config.hassUrl, config.token);
        if (cancelled) {
          client.disconnect();
          return;
        }
        clientRef.current = client;
        unsub = client.subscribe((e) => !cancelled && setEntities(e));
        setStatus('connected');
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setError(err instanceof Error ? err.message : String(err));
      }
    }

    connect();

    return () => {
      cancelled = true;
      unsub?.();
      clientRef.current?.disconnect();
      clientRef.current = null;
    };
  }, [config]);

  const saveConfig = useCallback((c: AppConfig) => {
    persist(c);
    setConfig(c);
  }, []);

  const callService = useCallback<HassContextValue['callService']>(
    async (domain, service, data, target) => {
      const client = clientRef.current;
      if (!client) return;
      try {
        await client.callService(domain, service, data, target);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('callService selhal:', domain, service, err);
      }
    },
    [],
  );

  const value = useMemo<HassContextValue>(
    () => ({ status, error, entities, config, saveConfig, callService }),
    [status, error, entities, config, saveConfig, callService],
  );

  return <HassContext.Provider value={value}>{children}</HassContext.Provider>;
}

export function useHass(): HassContextValue {
  const ctx = useContext(HassContext);
  if (!ctx) throw new Error('useHass musí být uvnitř <HassProvider>');
  return ctx;
}
