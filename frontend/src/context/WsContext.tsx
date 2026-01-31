import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';

type WSContextType = {
  send: (event: string, payload: any) => void;
  listen: <T>(event: string, handler: (payload: T) => void) => () => void;
};

const WSContext = createContext<WSContextType | null>(null);

export const WSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const wsRef = useRef<ReconnectingWebSocket | null>(null);
  const [listeners] = useState<Record<string, ((payload: any) => void)[]>>({});

  useEffect(() => {
    const ws = new ReconnectingWebSocket('ws://localhost:3080/ws');
    wsRef.current = ws;

    ws.addEventListener('open', () => console.debug('WS connected'));
    ws.addEventListener('close', () => console.debug('WS disconnected'));

    ws.addEventListener('message', (event) => {
      try {
        const { event: ev, payload } = JSON.parse(event.data);
        listeners[ev]?.forEach((cb) => cb(payload));
      } catch (e) {
        console.warn(`Invalid WS message ${e}`, event.data);
      }
    });

    return () => {
      ws.close();
    };
  }, [listeners]);

  const send = (event: string, payload: any) => {
    wsRef.current?.send(JSON.stringify({ event, payload }));
  };

  const listen = <T,>(event: string, handler: (payload: T) => void) => {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(handler);

    return () => {
      listeners[event] = listeners[event].filter((h) => h !== handler);
    };
  };

  return <WSContext.Provider value={{ send, listen }}>{children}</WSContext.Provider>;
};

export const useWS = () => {
  const ctx = useContext(WSContext);
  if (!ctx) throw new Error('useWS must be used inside WSProvider');
  return ctx;
};
