import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';

import { ExercisePicker } from '@/components/ExercisePicker';
import { Screen } from '@/components/ui';
import { addExerciseToSession } from '@/db/repo';
import { adHocRoutineExercise, planExercise } from '@/state/planning';
import { useRequiredProfile } from '@/state/profile';
import { saveCustomProgram, useUserCatalog } from '@/state/userCatalog';

/** Escolhe um exercício para o treino em andamento (`sessionId`) ou para um dia de uma ficha (`fichaId` + `diaId`). */
export default function Adicionar() {
  const { sessionId, fichaId, diaId } = useLocalSearchParams<{ sessionId?: string; fichaId?: string; diaId?: string }>();
  const db = useSQLiteContext();
  const profile = useRequiredProfile();
  const ficha = useUserCatalog((s) => s.programs.find((p) => p.id === fichaId));
  const [busy, setBusy] = useState(false);

  return (
    <Screen edges={['bottom']}>
      <ExercisePicker
        onPick={async (e) => {
          if (busy) return;
          setBusy(true);
          const r = adHocRoutineExercise(e.id, profile.objetivo, profile.descansoPadraoSeg);
          if (ficha && diaId) {
            await saveCustomProgram(db, {
              ...ficha,
              dias: ficha.dias.map((d) => (d.id === diaId ? { ...d, exercicios: [...d.exercicios, r] } : d)),
            });
          } else if (sessionId) {
            await addExerciseToSession(db, Number(sessionId), await planExercise(db, r));
          }
          router.back();
        }}
      />
    </Screen>
  );
}
