import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';

import { ExercisePicker } from '@/components/ExercisePicker';
import { Screen } from '@/components/ui';
import { addExerciseToSession } from '@/db/repo';
import { adHocRoutineExercise, planExercise } from '@/state/planning';
import { useRequiredProfile } from '@/state/profile';

export default function Adicionar() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const db = useSQLiteContext();
  const profile = useRequiredProfile();
  const [busy, setBusy] = useState(false);

  return (
    <Screen edges={['bottom']}>
      <ExercisePicker
        onPick={async (e) => {
          if (busy) return;
          setBusy(true);
          const planned = await planExercise(db, adHocRoutineExercise(e.id, profile.objetivo, profile.descansoPadraoSeg));
          await addExerciseToSession(db, Number(sessionId), planned);
          router.back();
        }}
      />
    </Screen>
  );
}
