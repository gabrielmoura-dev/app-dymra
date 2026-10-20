import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { View } from 'react-native';

import { getExercise, getMachine } from '@/catalog';
import type { Program, RoutineDay, RoutineExercise } from '@/catalog/types';
import { confirmAction } from '@/components/confirm';
import { Stepper, TextField } from '@/components/inputs';
import { Button, Card, Chip, Empty, IconButton, Row, Screen, Txt } from '@/components/ui';
import { nextDayId } from '@/logic/programGenerator';
import { useProfile, useRequiredProfile } from '@/state/profile';
import { removeCustomProgram, saveCustomProgram, useUserCatalog } from '@/state/userCatalog';
import { colors, spacing } from '@/theme';

function ExercicioDaFicha({
  r,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  r: RoutineExercise;
  index: number;
  total: number;
  onChange: (r: RoutineExercise) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const ex = getExercise(r.exercicioId);
  const cardio = ex?.padrao === 'cardio';
  const porTempo = ex?.tipo === 'tempo' || r.duracaoSeg != null;
  return (
    <View style={{ gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: index === 0 ? 0 : 1, borderColor: colors.border }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt bold>
            {index + 1}. {ex?.nome ?? `${r.exercicioId} (fora do catálogo)`}
          </Txt>
          {ex ? <Txt variant="tiny">{getMachine(ex.maquinaIds[0])?.nome}</Txt> : null}
        </View>
        <IconButton icon="chevron-up" label="Subir" size={18} onPress={() => index > 0 && onMove(-1)} color={index > 0 ? colors.text : colors.faint} />
        <IconButton
          icon="chevron-down"
          label="Descer"
          size={18}
          onPress={() => index < total - 1 && onMove(1)}
          color={index < total - 1 ? colors.text : colors.faint}
        />
        <IconButton icon="trash-outline" label="Tirar da ficha" size={18} onPress={onRemove} color={colors.danger} />
      </Row>
      <Row gap={spacing.sm}>
        <Stepper label="Séries" value={r.series} onChange={(v) => onChange({ ...r, series: Math.max(1, Math.round(v ?? 1)) })} step={1} min={1} decimals={false} />
        <Stepper
          label="Descanso"
          value={r.descansoSeg}
          onChange={(v) => onChange({ ...r, descansoSeg: Math.max(0, Math.round(v ?? 0)) })}
          step={15}
          suffix="s"
          decimals={false}
        />
      </Row>
      {porTempo ? (
        cardio ? (
          <Stepper
            label="Duração"
            value={r.duracaoSeg == null ? null : Math.round(r.duracaoSeg / 60)}
            onChange={(v) => onChange({ ...r, duracaoSeg: Math.max(1, Math.round(v ?? 1)) * 60 })}
            step={1}
            min={1}
            suffix="min"
            decimals={false}
          />
        ) : (
          <Stepper
            label="Duração"
            value={r.duracaoSeg ?? null}
            onChange={(v) => onChange({ ...r, duracaoSeg: Math.max(5, Math.round(v ?? 5)) })}
            step={5}
            min={5}
            suffix="s"
            decimals={false}
          />
        )
      ) : (
        <Row gap={spacing.sm}>
          <Stepper
            label="Reps mín."
            value={r.repsMin}
            onChange={(v) => {
              const repsMin = Math.max(1, Math.round(v ?? 1));
              onChange({ ...r, repsMin, repsMax: Math.max(repsMin, r.repsMax) });
            }}
            step={1}
            min={1}
            decimals={false}
          />
          <Stepper
            label="Reps máx."
            value={r.repsMax}
            onChange={(v) => {
              const repsMax = Math.max(1, Math.round(v ?? 1));
              onChange({ ...r, repsMax, repsMin: Math.min(repsMax, r.repsMin) });
            }}
            step={1}
            min={1}
            decimals={false}
          />
        </Row>
      )}
    </View>
  );
}

export default function EditarFicha() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const profile = useRequiredProfile();
  const { update } = useProfile();
  const program = useUserCatalog((s) => s.programs.find((p) => p.id === id));

  if (!program) {
    return (
      <Screen edges={['bottom']}>
        <Empty icon="help" title="Ficha não encontrada" text="Só as fichas criadas no celular podem ser editadas." />
      </Screen>
    );
  }

  const salvar = (p: Program) => saveCustomProgram(db, p);
  const salvarDia = (dia: RoutineDay) => salvar({ ...program, dias: program.dias.map((d) => (d.id === dia.id ? dia : d)) });

  const moverExercicio = (dia: RoutineDay, i: number, dir: -1 | 1) => {
    const list = [...dia.exercicios];
    [list[i], list[i + dir]] = [list[i + dir], list[i]];
    salvarDia({ ...dia, exercicios: list });
  };

  const adicionarDia = () => {
    const novoId = nextDayId(program.dias);
    salvar({ ...program, dias: [...program.dias, { id: novoId, nome: `Treino ${novoId}`, foco: '', exercicios: [] }] });
  };

  const apagarDia = async (dia: RoutineDay) => {
    const ok = await confirmAction({
      title: `Apagar ${dia.nome}?`,
      message: 'Os treinos já feitos continuam no histórico.',
      confirmText: 'Apagar',
      destructive: true,
    });
    if (ok) salvar({ ...program, dias: program.dias.filter((d) => d.id !== dia.id) });
  };

  const apagarFicha = async () => {
    const ok = await confirmAction({
      title: 'Apagar esta ficha?',
      message: 'Os treinos já feitos continuam no histórico.',
      confirmText: 'Apagar ficha',
      destructive: true,
    });
    if (!ok) return;
    if (profile.programaId === program.id) await update({ programaId: null });
    await removeCustomProgram(db, program.id);
    router.back();
  };

  const atual = profile.programaId === program.id;

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: 'Editar ficha' }} />
      <Card>
        <TextField label="Nome da ficha" value={program.nome} onChangeText={(nome) => salvar({ ...program, nome })} />
        <TextField label="Descrição" value={program.descricao} onChangeText={(descricao) => salvar({ ...program, descricao })} placeholder="Opcional" />
        {atual ? (
          <Chip label="É a sua ficha atual" active />
        ) : (
          <Button small variant="secondary" title="Usar como minha ficha" onPress={() => update({ programaId: program.id })} />
        )}
      </Card>

      {program.dias.map((dia) => (
        <Card key={dia.id}>
          <Row style={{ alignItems: 'flex-end' }}>
            <TextField label="Treino" value={dia.nome} onChangeText={(nome) => salvarDia({ ...dia, nome })} />
            <IconButton icon="trash-outline" label={`Apagar ${dia.nome}`} onPress={() => apagarDia(dia)} color={colors.danger} />
          </Row>
          <TextField value={dia.foco} onChangeText={(foco) => salvarDia({ ...dia, foco })} placeholder="Foco (ex.: pernas e glúteos)" />
          {dia.exercicios.length === 0 ? (
            <Txt variant="small" color={colors.muted}>
              Nenhum exercício ainda.
            </Txt>
          ) : null}
          {dia.exercicios.map((r, i) => (
            <ExercicioDaFicha
              key={`${r.exercicioId}-${i}`}
              r={r}
              index={i}
              total={dia.exercicios.length}
              onChange={(nr) => salvarDia({ ...dia, exercicios: dia.exercicios.map((x, j) => (j === i ? nr : x)) })}
              onMove={(dir) => moverExercicio(dia, i, dir)}
              onRemove={() => salvarDia({ ...dia, exercicios: dia.exercicios.filter((_, j) => j !== i) })}
            />
          ))}
          <Button
            small
            variant="secondary"
            icon="add"
            title="Adicionar exercício"
            onPress={() => router.push({ pathname: '/adicionar', params: { fichaId: program.id, diaId: dia.id } })}
          />
        </Card>
      ))}

      <Button variant="secondary" icon="add-circle-outline" title="Adicionar treino (dia)" onPress={adicionarDia} />
      <Button variant="ghost" title="Apagar ficha" onPress={apagarFicha} />
    </Screen>
  );
}
