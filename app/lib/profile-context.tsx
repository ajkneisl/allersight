import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiFetch } from './api';
import { useAuth } from './auth-context';

type Profile = {
  allergens: string[];
  diet: string;
  calorieGoal: number;
};

const defaults: Profile = { allergens: [], diet: 'none', calorieGoal: 2000 };
const Ctx = createContext<Profile>(defaults);

export const useProfile = () => useContext(Ctx);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [profile, setProfile] = useState<Profile>(defaults);

  useEffect(() => {
    if (!token) return;
    apiFetch<Profile>('/profile', {}, token).then(setProfile).catch(() => {});
  }, [token]);

  return <Ctx.Provider value={profile}>{children}</Ctx.Provider>;
}
