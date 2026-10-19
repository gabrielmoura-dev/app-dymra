import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { PROGRAMS } from '@/catalog';
import type { Goal, Sex } from '@/catalog/types';
import { parseNumber, TextField } from '@/components/inputs';
import { Button, Card, Chip, Row, Screen, Txt } from '@/components/ui';
import { createProfile } from '@/db/repo';
import { suggestedWaterGoal } from '@/logic/calories';
import { GOAL_LABELS } from '@/logic/progression';
import { useProfile } from '@/state/profile';
import { colors, spacing } from '@/theme';

const GOALS: Goal[] = ['hipertrofia', 'emagrecimento', 'condicionamento'];

export default function Onboarding() {
  const db = useSQLiteContext();
  const { refresh } = useProfile();
  const [nome, setNome] = useState('');
  const [sexo, setSexo] = useState<Sex | null>(null);
  const [objetivo, setObjetivo] = useState<Goal>('hipertrofia');
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [programaId, setProgramaId] = useState<string>(PROGRAMS[0]?.id ?? '');
  const [salvando, setSalvando] = useState(false);

  const pesoN = parseNumber(peso);
  const alturaN = parseNumber(altura);
  const valido = nome.trim().length > 0 && sexo != null && pesoN != null && pesoN > 25 && pesoN < 300 && alturaN != null && alturaN > 100 && alturaN < 230;

  const salvar = async () => {
    if (!valido || pesoN == null || alturaN == null || sexo == null) return;
    setSalvando(true);
    try {
      await createProfile(db, {
        nome: nome.trim(),
        sexo,
        objetivo,
        pesoKg: pesoN,
        alturaCm: alturaN,
        metaAguaMl: suggestedWaterGoal(pesoN),
        programaId: programaId || null,
      });
      await refresh();
    } catch (e) {
      Alert.alert('Não deu para salvar', String(e));
      setSalvando(false);
    }
  };

  return (
    <Screen>
      <View style={{ gap: spacing.xs, marginTop: spacing.lg }}>
        <Txt variant="h1">
          Boas-vindas ao <Txt variant="h1" color={colors.accent}>Dymra</Txt>
        </Txt>
        <Txt color={colors.muted}>Alguns dados para personalizar seu treino. Tudo fica só no seu celular.</Txt>
      </View>

      <Card>
        <TextField label="Seu nome" value={nome} onChangeText={setNome} placeholder="Nome ou apelido" />
        <Txt variant="label" style={{ marginTop: spacing.sm }}>
          Corpo (para o mapa muscular e calorias)
        </Txt>
        <Row>
          <Chip label="Feminino" active={sexo === 'feminino'} onPress={() => setSexo('feminino')} />
          <Chip label="Masculino" active={sexo === 'masculino'} onPress={() => setSexo('masculino')} />
        </Row>
        <Row gap={spacing.md} style={{ marginTop: spacing.sm }}>
          <TextField label="Peso" value={peso} onChangeText={setPeso} keyboardType="decimal-pad" suffix="kg" placeholder="60" />
          <TextField label="Altura" value={altura} onChangeText={setAltura} keyboardType="number-pad" suffix="cm" placeholder="165" />
        </Row>
      </Card>

      <Card>
        <Txt variant="label">Objetivo principal</Txt>
        <Row wrap>
          {GOALS.map((g) => (
            <Chip key={g} label={GOAL_LABELS[g]} active={objetivo === g} onPress={() => setObjetivo(g)} />
          ))}
        </Row>
        <Txt variant="tiny">Define a faixa de repetições padrão e o tipo de sugestão.</Txt>
      </Card>

      <Card>
        <Txt variant="label">Sua ficha de treino</Txt>
        {PROGRAMS.map((p) => (
          <Card
            key={p.id}
            onPress={() => setProgramaId(p.id)}
            tone={programaId === p.id ? 'accent' : 'default'}
            style={{ backgroundColor: programaId === p.id ? colors.accentSoft : colors.surface2 }}>
            <Txt variant="h3">{p.nome}</Txt>
            <Txt variant="small" color={colors.muted}>
              {p.descricao}
            </Txt>
            <Txt variant="tiny">
              {p.dias.length} treinos · de {p.dono}
            </Txt>
          </Card>
        ))}
        <Txt variant="tiny">Você pode trocar de ficha depois, em Fichas.</Txt>
      </Card>

      <Button title="Começar" icon="arrow-forward" onPress={salvar} disabled={!valido} loading={salvando} />
      {!valido ? (
        <Txt variant="tiny" center>
          Preencha nome, corpo, peso e altura para continuar.
        </Txt>
      ) : null}
    </Screen>
  );
}
