import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';

import { getExercise, getProgram, MUSCLE_LABELS } from '@/catalog';
import type { Muscle, RoutineDay } from '@/catalog/types';
import { MuscleMap } from '@/components/MuscleMap';
import { Button, Card, Chip, Icon, Row, Screen, Stat, Txt } from '@/components/ui';
import { WaterCard } from '@/components/WaterCard';
import {
  getActiveSessionId,
  getCompletedSetsSince,
  getLastCompletedSession,
  listSessionDates,
  type SessionRow,
} from '@/db/repo';
import { daysAgo, formatDateLong, greeting, hoursBetween } from '@/logic/dates';
import { muscleInsights, muscleRecovery, sessionMuscleIntensity, weeklyVolume, type MuscleInsight } from '@/logic/recovery';
import { nextRoutineDay, sessionsThisWeek } from '@/logic/summary';
import { startRoutineSession } from '@/state/planning';
import { useRequiredProfile } from '@/state/profile';
import { colors, spacing } from '@/theme';

export default function Hoje() {
  const db = useSQLiteContext();
  const profile = useRequiredProfile();
  const program = getProgram(profile.programaId);

  const [activeId, setActiveId] = useState<number | null>(null);
  const [lastSession, setLastSession] = useState<SessionRow | null>(null);
  const [day, setDay] = useState<RoutineDay | null>(null);
  const [recovery, setRecovery] = useState<Record<Muscle, number> | null>(null);
  const [insights, setInsights] = useState<MuscleInsight[]>([]);
  const [semana, setSemana] = useState(0);
  const [iniciando, setIniciando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const [active, last, sets, dates] = await Promise.all([
          getActiveSessionId(db),
          getLastCompletedSession(db),
          getCompletedSetsSince(db, daysAgo(7).toISOString()),
          listSessionDates(db, daysAgo(8).toISOString()),
        ]);
        if (!alive) return;
        setActiveId(active);
        setLastSession(last);
        const next = program ? nextRoutineDay(program, last?.dia_id ?? null, last?.programa_id ?? null) : null;
        setDay(next);
        const rec = muscleRecovery(sets, getExercise);
        setRecovery(rec);
        const vol = weeklyVolume(sets, getExercise);
        const muscles = (d: RoutineDay | null) =>
          [...new Set((d?.exercicios ?? []).flatMap((r) => getExercise(r.exercicioId)?.primarios ?? []))];
        // "Pouco treinado" só depois de um ciclo completo da ficha nos últimos 7 dias, e nunca para o que vai ser treinado hoje.
        const ultimos7 = dates.filter((d) => new Date(d) >= daysAgo(7)).length;
        const cicloCompleto = program != null && ultimos7 >= program.dias.length;
        const hoje = muscles(next);
        const programMuscles =
          cicloCompleto ? [...new Set((program?.dias ?? []).flatMap((d) => muscles(d)))].filter((m) => !hoje.includes(m)) : [];
        setInsights(muscleInsights(rec, vol, hoje, programMuscles).slice(0, 3));
        setSemana(sessionsThisWeek(dates));
      })();
      return () => {
        alive = false;
      };
    }, [db, program]),
  );

  const iniciar = async (d: RoutineDay | null) => {
    if (activeId) {
      router.push('/sessao');
      return;
    }
    setIniciando(true);
    try {
      await startRoutineSession(db, {
        programaId: d ? (program?.id ?? null) : null,
        day: d,
        nome: d ? d.nome : 'Treino livre',
        pesoCorporalKg: profile.pesoKg,
      });
      router.push('/sessao');
    } catch (e) {
      Alert.alert('Não deu para iniciar', String(e));
    } finally {
      setIniciando(false);
    }
  };

  const dayIntensity = day
    ? sessionMuscleIntensity(
        day.exercicios.map((r) => ({ exercicioId: r.exercicioId, series: r.series })),
        getExercise,
      )
    : {};

  const precisaBackup =
    lastSession != null && (!profile.ultimoBackupEm || hoursBetween(profile.ultimoBackupEm, new Date()) > 24 * 14);

  return (
    <Screen>
      <View style={{ gap: 2 }}>
        <Txt variant="small" color={colors.muted}>
          {formatDateLong(new Date().toISOString())}
        </Txt>
        <Txt variant="h1">
          {greeting()}, {profile.nome.split(' ')[0]}!
        </Txt>
      </View>

      {activeId ? (
        <Card tone="accent" onPress={() => router.push('/sessao')}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ gap: 2, flex: 1 }}>
              <Txt variant="label" color={colors.accent}>
                Em andamento
              </Txt>
              <Txt variant="h3">Você tem um treino aberto</Txt>
            </View>
            <Icon name="play-circle" size={40} color={colors.accent} />
          </Row>
        </Card>
      ) : null}

      {day && program ? (
        <Card>
          <Txt variant="label">Próximo treino · {program.nome}</Txt>
          <Txt variant="h2">{day.nome}</Txt>
          <Txt color={colors.muted}>
            {day.foco} · {day.exercicios.length} exercícios
          </Txt>
          <MuscleMap values={dayIntensity} mode="intensidade" height={180} />
          <Button
            title={activeId ? 'Continuar treino' : 'Começar treino'}
            icon="play"
            onPress={() => iniciar(day)}
            loading={iniciando}
          />
          <Row>
            <Button small variant="ghost" title="Outro treino" onPress={() => router.push('/treinos')} style={{ flex: 1 }} />
            <Button small variant="ghost" title="Treino livre" onPress={() => iniciar(null)} style={{ flex: 1 }} />
          </Row>
        </Card>
      ) : (
        <Card>
          <Txt variant="h3">Nenhuma ficha escolhida</Txt>
          <Txt color={colors.muted}>Escolha uma ficha em Fichas ou comece um treino livre.</Txt>
          <Row>
            <Button title="Ver fichas" variant="secondary" onPress={() => router.push('/treinos')} style={{ flex: 1 }} />
            <Button title="Treino livre" onPress={() => iniciar(null)} style={{ flex: 1 }} loading={iniciando} />
          </Row>
        </Card>
      )}

      {insights.length > 0 ? (
        <Card>
          <Txt variant="label">Dicas de hoje</Txt>
          {insights.map((i) => (
            <Row key={`${i.tipo}-${i.muscle}`} style={{ alignItems: 'flex-start' }}>
              <Icon
                name={i.tipo === 'recuperando' ? 'bed-outline' : 'alert-circle-outline'}
                size={18}
                color={i.tipo === 'recuperando' ? colors.warning : colors.violet}
              />
              <Txt variant="small" style={{ flex: 1 }}>
                {i.tipo === 'recuperando'
                  ? `${MUSCLE_LABELS[i.muscle]} ainda está se recuperando. Pegue um pouco mais leve ou foque na técnica.`
                  : `${MUSCLE_LABELS[i.muscle]} teve poucas séries nos últimos 7 dias.`}
              </Txt>
            </Row>
          ))}
        </Card>
      ) : null}

      <WaterCard metaMl={profile.metaAguaMl} healthConnect={profile.healthConnect} />

      <Card onPress={() => router.push('/progresso')}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt variant="h3">Recuperação muscular</Txt>
          <Icon name="chevron-forward" color={colors.muted} />
        </Row>
        {recovery ? <MuscleMap values={recovery} mode="recuperacao" height={170} /> : null}
        <Row gap={spacing.lg}>
          <Stat label="treinos nesta semana" value={String(semana)} />
          <Stat
            label="último treino"
            value={lastSession ? formatDateLong(lastSession.iniciado_em).split(',')[0] : '–'}
          />
        </Row>
      </Card>

      {precisaBackup ? (
        <Card tone="violet" onPress={() => router.push('/perfil')}>
          <Row>
            <Icon name="cloud-upload-outline" color={colors.violet} />
            <View style={{ flex: 1 }}>
              <Txt variant="h3">Hora do backup</Txt>
              <Txt variant="small" color={colors.muted}>
                Seus treinos ficam só neste celular. Salve um backup no Drive para não perder nada.
              </Txt>
            </View>
          </Row>
        </Card>
      ) : null}

      <Row wrap>
        <Chip icon="qr-code-outline" label="Ler QR da máquina" onPress={() => router.push('/scanner')} />
        <Chip icon="body-outline" label="Corpo e fotos" onPress={() => router.push('/corpo')} />
      </Row>
    </Screen>
  );
}
