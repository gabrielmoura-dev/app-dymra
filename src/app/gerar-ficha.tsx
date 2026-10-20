import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';

import { EXERCISES } from '@/catalog';
import { DEFAULT_WIZARD, ProgramWizard, type WizardChoice } from '@/components/ProgramWizard';
import { Button, Card, Screen, Txt } from '@/components/ui';
import { generateProgram } from '@/logic/programGenerator';
import { GOAL_LABELS } from '@/logic/progression';
import { useProfile, useRequiredProfile } from '@/state/profile';
import { newCustomProgramId, saveCustomProgram } from '@/state/userCatalog';
import { colors } from '@/theme';

export default function GerarFicha() {
  const db = useSQLiteContext();
  const profile = useRequiredProfile();
  const { update } = useProfile();
  const [wizard, setWizard] = useState<WizardChoice>(DEFAULT_WIZARD);
  const [id] = useState(newCustomProgramId);
  const [busy, setBusy] = useState(false);

  const preview = generateProgram({ nome: profile.nome, objetivo: profile.objetivo, ...wizard }, EXERCISES, id);

  const criar = async () => {
    setBusy(true);
    await saveCustomProgram(db, preview);
    await update({ programaId: preview.id });
    router.replace(`/ficha/${preview.id}`);
  };

  return (
    <Screen edges={['bottom']}>
      <Txt color={colors.muted}>
        Objetivo: {GOAL_LABELS[profile.objetivo]} (muda em Perfil). A ficha nova vira a sua ficha atual e abre para você ajustar.
      </Txt>
      <Card>
        <ProgramWizard value={wizard} onChange={setWizard} preview={preview} />
      </Card>
      <Button title="Criar ficha" icon="sparkles" onPress={criar} loading={busy} />
    </Screen>
  );
}
