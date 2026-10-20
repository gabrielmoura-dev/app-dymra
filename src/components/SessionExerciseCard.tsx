import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { getExercise, getMachine, loadStepFor } from '@/catalog';
import type { SessionExerciseRow, SetRow } from '@/db/repo';
import type { Suggestion } from '@/logic/progression';
import type { Effort } from '@/logic/types';
import { useStepOverrides } from '@/state/userCatalog';
import { colors, radius, spacing } from '@/theme';

import { Stepper, TextField } from './inputs';
import { TechniqueQuick } from './TechniqueChecklist';
import { Button, Card, Chip, Icon, IconButton, Row, Txt } from './ui';

const EFFORTS: { v: Effort; label: string }[] = [
  { v: 1, label: 'Fácil' },
  { v: 2, label: 'Ok' },
  { v: 3, label: 'Difícil' },
];

export interface SessionExerciseCardProps {
  item: SessionExerciseRow;
  sets: SetRow[];
  suggestion: Suggestion | null;
  note: string;
  onUpdateSet: (setId: number, patch: { pesoKg?: number | null; reps?: number | null; duracaoSeg?: number | null; esforco?: Effort | null }) => void;
  onToggleSet: (set: SetRow, done: boolean) => void;
  onAddSet: () => void;
  onRemoveSet: (setId: number) => void;
  onRemoveExercise: () => void;
  onSaveNote: (nota: string) => void;
}

export function SessionExerciseCard(p: SessionExerciseCardProps) {
  const ex = getExercise(p.item.exercicio_id);
  const original = p.item.substituto_de ? getExercise(p.item.substituto_de) : null;
  const overrides = useStepOverrides();
  const [showTech, setShowTech] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState(p.note);
  const [lastNote, setLastNote] = useState(p.note);
  if (p.note !== lastNote) {
    setLastNote(p.note);
    setNote(p.note);
  }

  if (!ex) {
    return (
      <Card>
        <Txt>Exercício removido do catálogo ({p.item.exercicio_id}).</Txt>
        <Button small variant="ghost" title="Tirar do treino" onPress={p.onRemoveExercise} />
      </Card>
    );
  }

  const step = loadStepFor(ex, overrides);
  const machine = getMachine(ex.maquinaIds[0]);
  const done = p.sets.filter((s) => s.concluida === 1).length;
  const allDone = done === p.sets.length && p.sets.length > 0;
  const porTempo = ex.tipo === 'tempo';
  const semCarga = ex.tipo === 'peso-corporal' || porTempo;

  const menu = () =>
    Alert.alert(ex.nome, undefined, [
      { text: 'Ver ficha completa', onPress: () => router.push(`/exercicio/${ex.id}`) },
      { text: 'Tirar do treino de hoje', style: 'destructive', onPress: p.onRemoveExercise },
      { text: 'Cancelar', style: 'cancel' },
    ]);

  return (
    <Card style={allDone ? { borderColor: colors.success } : undefined}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Pressable style={{ flex: 1, gap: 2 }} onPress={() => router.push(`/exercicio/${ex.id}`)}>
          <Txt variant="h3">{ex.nome}</Txt>
          <Txt variant="tiny">
            {machine && machine.nome !== ex.nome ? `${machine.nome} · ` : ''}
            {porTempo ? '' : `${p.item.reps_min === p.item.reps_max ? p.item.reps_min : `${p.item.reps_min}–${p.item.reps_max}`} reps · `}
            {`descanso ${p.item.descanso_seg}s`}
          </Txt>
          {original ? (
            <Txt variant="tiny" color={colors.violet}>
              No lugar de: {original.nome}
            </Txt>
          ) : null}
        </Pressable>
        <Row gap={6}>
          {allDone ? <Icon name="checkmark-circle" color={colors.success} size={26} /> : null}
          <IconButton icon="ellipsis-vertical" label="Mais opções" onPress={menu} />
        </Row>
      </Row>

      <Row wrap gap={6}>
        <Chip icon="body-outline" label="Técnica" active={showTech} tone="violet" onPress={() => setShowTech((v) => !v)} />
        <Chip icon="play-circle-outline" label="Vídeo" onPress={() => router.push(`/exercicio/${ex.id}`)} />
        <Chip
          icon="swap-horizontal"
          label="Máquina ocupada"
          onPress={() => router.push({ pathname: '/trocar', params: { seId: String(p.item.id) } })}
        />
        <Chip icon="create-outline" label={p.note ? 'Nota ✓' : 'Nota'} active={showNote} tone="muted" onPress={() => setShowNote((v) => !v)} />
      </Row>

      {showTech ? (
        <View style={styles.inner}>
          <TechniqueQuick t={ex.tecnica} />
        </View>
      ) : null}

      {showNote ? (
        <View style={{ gap: spacing.sm }}>
          <TextField
            value={note}
            onChangeText={setNote}
            placeholder="Ex.: banco na posição 4, pegada aberta"
            multiline
          />
          <Button small variant="secondary" title="Salvar nota" onPress={() => p.onSaveNote(note)} />
        </View>
      ) : p.note ? (
        <Txt variant="small" color={colors.muted}>
          📝 {p.note}
        </Txt>
      ) : null}

      {p.suggestion ? (
        <View style={[styles.inner, { borderColor: colors.accentSoft }]}>
          <Row gap={6}>
            <Icon name="sparkles" size={16} color={colors.accent} />
            <Txt variant="small" bold color={colors.accent}>
              {p.suggestion.titulo}
            </Txt>
          </Row>
          <Txt variant="small" color={colors.muted}>
            {p.suggestion.mensagem}
          </Txt>
          {p.suggestion.ultimaVez ? <Txt variant="tiny">Última vez: {p.suggestion.ultimaVez}</Txt> : null}
        </View>
      ) : null}

      <View style={{ gap: spacing.sm }}>
        {p.sets.map((s) => {
          const ok = s.concluida === 1;
          const aquec = s.aquecimento === 1;
          // Aquecimento não conta na numeração das séries de trabalho.
          const n = p.sets.filter((x) => x.aquecimento === 0 && x.ordem <= s.ordem).length;
          const titulo = aquec ? 'Aquecimento' : `Série ${n}`;
          return (
            <View key={s.id} style={[styles.setRow, ok && styles.setRowDone]}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Pressable
                  onLongPress={() =>
                    Alert.alert(titulo, 'Remover esta série?', [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Remover', style: 'destructive', onPress: () => p.onRemoveSet(s.id) },
                    ])
                  }
                  style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
                  <View style={[styles.setNumber, aquec && styles.setWarm, ok && { backgroundColor: aquec ? colors.warning : colors.accent }]}>
                    {aquec ? (
                      <Icon name="flame-outline" size={18} color={ok ? colors.accentText : colors.warning} />
                    ) : (
                      <Txt bold color={ok ? colors.accentText : colors.muted}>
                        {n}
                      </Txt>
                    )}
                  </View>
                  {ok && !aquec ? (
                    <Row gap={4} wrap style={{ flex: 1 }}>
                      {EFFORTS.map((e) => (
                        <Chip
                          key={e.v}
                          label={e.label}
                          active={s.esforco === e.v}
                          tone={e.v === 3 ? 'violet' : 'accent'}
                          onPress={() => p.onUpdateSet(s.id, { esforco: s.esforco === e.v ? null : e.v })}
                        />
                      ))}
                    </Row>
                  ) : (
                    <Txt variant="tiny" color={aquec ? colors.warning : undefined}>
                      {aquec ? 'Aquecimento · carga leve, sem cansar' : titulo}
                    </Txt>
                  )}
                </Pressable>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: ok }}
                  accessibilityLabel={`Concluir ${titulo.toLowerCase()}`}
                  onPress={() => p.onToggleSet(s, !ok)}
                  style={[styles.check, ok && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
                  <Icon name="checkmark" size={24} color={ok ? colors.accentText : colors.faint} />
                </Pressable>
              </Row>
              <Row gap={spacing.sm}>
                {porTempo && ex.padrao === 'cardio' ? (
                  <Stepper
                    value={s.duracao_seg == null ? null : Math.round(s.duracao_seg / 60)}
                    onChange={(v) => p.onUpdateSet(s.id, { duracaoSeg: v == null ? null : Math.round(v * 60) })}
                    step={1}
                    suffix="min"
                    decimals={false}
                  />
                ) : porTempo ? (
                  <Stepper
                    value={s.duracao_seg}
                    onChange={(v) => p.onUpdateSet(s.id, { duracaoSeg: v })}
                    step={5}
                    suffix="s"
                    decimals={false}
                  />
                ) : (
                  <>
                    {!semCarga || (s.peso_kg ?? 0) > 0 ? (
                      <Stepper value={s.peso_kg} onChange={(v) => p.onUpdateSet(s.id, { pesoKg: v })} step={step} suffix="kg" />
                    ) : null}
                    <Stepper
                      value={s.reps}
                      onChange={(v) => p.onUpdateSet(s.id, { reps: v })}
                      step={1}
                      suffix="rep"
                      decimals={false}
                    />
                  </>
                )}
              </Row>
            </View>
          );
        })}
      </View>
      <Button small variant="ghost" icon="add" title="Série" onPress={p.onAddSet} />
    </Card>
  );
}

const styles = StyleSheet.create({
  inner: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.surface2,
  },
  setRow: { gap: 6, padding: 6, borderRadius: radius.md },
  setRowDone: { backgroundColor: 'rgba(184, 255, 60, 0.06)' },
  setWarm: { borderWidth: 1, borderColor: colors.warning },
  setNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
  },
  check: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
