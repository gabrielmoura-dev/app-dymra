import { useSQLiteContext } from 'expo-sqlite';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { getProfile, updateProfile as updateProfileDb, type Profile } from '@/db/repo';

interface ProfileContextValue {
  profile: Profile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  update: (patch: Partial<Omit<Profile, 'criadoEm'>>) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setProfile(await getProfile(db));
    setLoading(false);
  }, [db]);

  const update = useCallback(
    async (patch: Partial<Omit<Profile, 'criadoEm'>>) => {
      await updateProfileDb(db, patch);
      await refresh();
    },
    [db, refresh],
  );

  useEffect(() => {
    let alive = true;
    getProfile(db).then((p) => {
      if (!alive) return;
      setProfile(p);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [db]);

  return <ProfileContext.Provider value={{ profile, loading, refresh, update }}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile fora do ProfileProvider');
  return ctx;
}

/** Valores usados só no instante entre abrir uma tela interna e o redirecionamento para o cadastro. */
const PLACEHOLDER: Profile = {
  nome: '',
  objetivo: 'hipertrofia',
  sexo: 'feminino',
  pesoKg: 60,
  alturaCm: 165,
  metaAguaMl: 2000,
  descansoPadraoSeg: 90,
  programaId: null,
  healthConnect: false,
  lembreteAgua: false,
  lembreteTreinoDias: [],
  lembreteTreinoHora: 18,
  ultimoBackupEm: null,
  criadoEm: '',
};

/** Para telas que só existem depois do cadastro (sem perfil, o layout raiz manda para o cadastro). */
export function useRequiredProfile(): Profile {
  return useProfile().profile ?? PLACEHOLDER;
}
