import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

import { getExerciseUsage } from '@/db/repo';
import type { Usage } from '@/logic/usage';

/** Uso de cada exercício, recarregado sempre que a tela ganha foco (depois de um treino, por exemplo). */
export function useExerciseUsage(): Usage {
  const db = useSQLiteContext();
  const [usage, setUsage] = useState<Usage>(() => new Map());
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getExerciseUsage(db).then((u) => {
        if (alive) setUsage(u);
      });
      return () => {
        alive = false;
      };
    }, [db]),
  );
  return usage;
}
