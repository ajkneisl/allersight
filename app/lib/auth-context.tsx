import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const TOKEN_KEY = 'auth_token';

type AuthCtx = {
  token: string | null;
  loading: boolean;
  setToken: (t: string | null) => void;
};

const Ctx = createContext<AuthCtx>({ token: null, loading: true, setToken: () => {} });

export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync(TOKEN_KEY).then((t) => {
      if (t) setTokenState(t);
      setLoading(false);
    });
  }, []);

  const setToken = (t: string | null) => {
    setTokenState(t);
    if (t) SecureStore.setItemAsync(TOKEN_KEY, t);
    else SecureStore.deleteItemAsync(TOKEN_KEY);
  };

  return <Ctx.Provider value={{ token, loading, setToken }}>{children}</Ctx.Provider>;
}
