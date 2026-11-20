import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { View } from "react-native";

import { getExercise, MUSCLE_LABELS } from "@/catalog";
import type { Muscle } from "@/catalog/types";
import { LineChart } from "@/components/LineChart";
import { MuscleMap, RecoveryLegend } from "@/components/MuscleMap";
import {
  Button,
  Card,
  Chip,
  Empty,
  ProgressBar,
  Recolhivel,
  Row,
  Screen,
  Stat,
  Txt,
} from "@/components/ui";
import {
  getAllExerciseHistory,
  getCompletedSetsSince,
  listBodyMeasures,
  listCompletedSessions,
  type BodyMeasure,
  type SessionListItem,
} from "@/db/repo";
import { consistency } from "@/logic/consistency";
import { daysAgo, formatDateLong, formatDuration } from "@/logic/dates";
import { muscleRecovery } from "@/logic/recovery";
import { formatKg, personalBests, type PersonalBests } from "@/logic/strength";
import { useProfile } from "@/state/profile";
import { useProgram } from "@/state/userCatalog";
import { colors, spacing } from "@/theme";

type Aba = "visao" | "recordes" | "historico";

/** Quantos treinos o histórico mostra de cada vez. */
const PAGINA = 20;

export default function Progresso() {
  const db = useSQLiteContext();
  const [aba, setAba] = useState<Aba>("visao");
  const [recovery, setRecovery] = useState<Record<Muscle, number> | null>(null);
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [bests, setBests] = useState<
    { id: string; pb: PersonalBests; vezes: number }[]
  >([]);
  const [measures, setMeasures] = useState<BodyMeasure[]>([]);
  const [visiveis, setVisiveis] = useState(PAGINA);
  const { profile } = useProfile();
  const programa = useProgram(profile?.programaId);
  const constancia = consistency(sessions.map((s) => s.iniciado_em), profile?.metaSemanal ?? programa?.dias.length ?? 3);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const [sets, sess, meds, historico] = await Promise.all([
          getCompletedSetsSince(db, daysAgo(7).toISOString()),
          listCompletedSessions(db, 200),
          listBodyMeasures(db),
          getAllExerciseHistory(db),
        ]);
        if (!alive) return;
        setRecovery(muscleRecovery(sets, getExercise));
        setSessions(sess);
        setMeasures(meds);
        const out = [...historico].map(([id, h]) => ({
          id,
          pb: personalBests(h),
          vezes: h.length,
        }));
        out.sort((a, b) =>
          (getExercise(a.id)?.nome ?? "").localeCompare(
            getExercise(b.id)?.nome ?? "",
          ),
        );
        setBests(out);
      })();
      return () => {
        alive = false;
      };
    }, [db]),
  );

  const ult30 = sessions.filter((s) => new Date(s.iniciado_em) >= daysAgo(30));
  // Músculos ainda cansados (abaixo de 85% recuperados), do mais cansado para o menos.
  const recuperando = recovery
    ? (Object.entries(recovery) as [Muscle, number][])
        .filter(([, v]) => v < 0.85)
        .sort((a, b) => a[1] - b[1])
        .map(([m]) => m)
    : [];
  const pesos = measures
    .filter((m) => m.pesoKg != null)
    .map((m) => ({ data: m.data, valor: m.pesoKg as number }));

  return (
    <Screen>
      <Txt variant="h1">Progresso</Txt>
      <Row>
        <Chip
          label="Visão geral"
          active={aba === "visao"}
          onPress={() => setAba("visao")}
        />
        <Chip
          label="Recordes"
          active={aba === "recordes"}
          onPress={() => setAba("recordes")}
        />
        <Chip
          label="Histórico"
          active={aba === "historico"}
          onPress={() => setAba("historico")}
        />
      </Row>

      {aba === "visao" ? (
        <>
          <Card>
            <Row gap={spacing.lg}>
              <Stat
                label="treinos em 30 dias"
                value={String(ult30.length)}
                color={colors.accent}
              />
              <Stat
                label="tempo em 30 dias"
                value={formatDuration(
                  ult30.reduce((a, s) => a + (s.duracao_seg ?? 0), 0),
                )}
              />
              <Stat
                label="kcal em 30 dias"
                value={String(
                  Math.round(ult30.reduce((a, s) => a + (s.kcal ?? 0), 0)),
                )}
                color={colors.warning}
              />
            </Row>
          </Card>

          <Card>
            <Txt variant="h3">Constância</Txt>
            <Row gap={spacing.lg}>
              <Stat
                label="nesta semana"
                value={`${constancia.nestaSemana}/${constancia.meta}`}
                color={constancia.nestaSemana >= constancia.meta ? colors.accent : colors.text}
              />
              <Stat label="semanas seguidas" value={String(constancia.semanasSeguidas)} color={colors.warning} />
            </Row>
            <ProgressBar value={Math.min(1, constancia.nestaSemana / constancia.meta)} color={colors.accent} />
          </Card>

          <Recolhivel
            titulo="Recuperação muscular"
            icon="body-outline"
            iconColor={colors.violet}
            resumo={
              recuperando.length === 0
                ? "Tudo recuperado"
                : `Recuperando: ${recuperando.slice(0, 3).map((m) => MUSCLE_LABELS[m]).join(", ")}${recuperando.length > 3 ? ` e mais ${recuperando.length - 3}` : ""}`
            }
          >
            {recovery ? (
              <MuscleMap values={recovery} mode="recuperacao" height={280} />
            ) : null}
            <RecoveryLegend />
          </Recolhivel>


          <Recolhivel
            titulo="Peso corporal"
            icon="scale-outline"
            iconColor={colors.violet}
            resumo={
              pesos.length > 0
                ? `Último: ${formatKg(pesos[pesos.length - 1].valor)} kg`
                : "Nenhum registro ainda"
            }
          >
            <LineChart points={pesos} unit="kg" color={colors.violet} />
            <Button
              small
              variant="secondary"
              icon="camera-outline"
              title="Corpo e fotos"
              onPress={() => router.push("/corpo")}
            />
          </Recolhivel>
        </>
      ) : null}

      {aba === "recordes" ? (
        bests.length === 0 ? (
          <Empty
            icon="trophy-outline"
            title="Nenhum recorde ainda"
            text="Termine seu primeiro treino para começar a acompanhar."
          />
        ) : (
          bests.map(({ id, pb, vezes }) => {
            const ex = getExercise(id);
            if (!ex) return null;
            return (
              <Card
                key={id}
                onPress={() => router.push(`/exercicio/${id}`)}
                style={{ paddingVertical: 12 }}
              >
                <Row style={{ justifyContent: "space-between" }}>
                  <View style={{ flex: 1 }}>
                    <Txt bold>{ex.nome}</Txt>
                    <Txt variant="tiny">
                      {vezes} {vezes === 1 ? "treino" : "treinos"}
                    </Txt>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    {ex.tipo === "tempo" ? (
                      <Txt bold color={colors.accent}>
                        {pb.duracaoMax} s
                      </Txt>
                    ) : ex.tipo === "peso-corporal" ? (
                      <Txt bold color={colors.accent}>
                        {pb.repsMax} reps
                      </Txt>
                    ) : (
                      <>
                        <Txt bold color={colors.accent}>
                          {formatKg(pb.pesoMax)} kg
                        </Txt>
                        <Txt variant="tiny">
                          1RM ~{formatKg(Math.round(pb.e1rm))} kg
                        </Txt>
                      </>
                    )}
                  </View>
                </Row>
              </Card>
            );
          })
        )
      ) : null}

      {aba === "historico" ? (
        sessions.length === 0 ? (
          <Empty icon="calendar-outline" title="Nenhum treino ainda" />
        ) : (
          <>
            {sessions.slice(0, visiveis).map((s) => (
              <Card
                key={s.id}
                onPress={() => router.push(`/historico/${s.id}`)}
                style={{ paddingVertical: 12 }}
              >
                <Row style={{ justifyContent: "space-between" }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt bold>{s.nome}</Txt>
                    <Txt variant="tiny">{formatDateLong(s.iniciado_em)}</Txt>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Txt variant="small">
                      {formatDuration(s.duracao_seg ?? 0)}
                    </Txt>
                    <Txt variant="tiny">
                      {s.series} séries · {formatKg(Math.round(s.volume_kg))} kg
                    </Txt>
                  </View>
                </Row>
              </Card>
            ))}
            {sessions.length > visiveis ? (
              <Button
                variant="ghost"
                title="Mostrar mais treinos"
                onPress={() => setVisiveis((v) => v + PAGINA)}
              />
            ) : null}
          </>
        )
      ) : null}
    </Screen>
  );
}
