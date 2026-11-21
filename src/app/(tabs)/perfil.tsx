import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as Updates from 'expo-updates';
import { useCallback, useState } from 'react';
import { Alert, Switch } from 'react-native';

import { CATALOG_VERSION } from '@/catalog';
import { addBodyMeasure } from '@/db/repo';
import type { Goal } from '@/catalog/types';
import { confirmAction, notify } from '@/components/confirm';
import { formatInput, parseNumber, Stepper, TextField } from '@/components/inputs';
import { Button, Card, Chip, Divider, Icon, Recolhivel, Row, Screen, Txt } from '@/components/ui';
import { formatDateLong } from '@/logic/dates';
import { GOAL_LABELS } from '@/logic/progression';
import { BackupError, exportBackup, importBackup } from '@/services/backup';
import { connectHealth, healthStatus, openHealthSettings, writeWeight, type HealthStatus } from '@/services/health';
import { syncReminders } from '@/services/notifications';
import { useProfile, useRequiredProfile } from '@/state/profile';
import { useProgram } from '@/state/userCatalog';
import { colors, spacing } from '@/theme';

const GOALS: Goal[] = ['hipertrofia', 'emagrecimento', 'condicionamento'];
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function Linha({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      <Txt style={{ flex: 1 }}>{label}</Txt>
      {children}
    </Row>
  );
}

export default function Perfil() {
  const db = useSQLiteContext();
  const profile = useRequiredProfile();
  const { update, refresh } = useProfile();
  const [nome, setNome] = useState(profile.nome);
  const [altura, setAltura] = useState(formatInput(profile.alturaCm));
  const [peso, setPeso] = useState(formatInput(profile.pesoKg));
  const [hc, setHc] = useState<HealthStatus>('indisponivel');
  const [busy, setBusy] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      healthStatus().then(setHc);
    }, []),
  );

  const salvarDados = async () => {
    const a = parseNumber(altura);
    await update({ nome: nome.trim() || profile.nome, alturaCm: a && a > 100 && a < 230 ? a : profile.alturaCm });
    // Peso novo vira um registro (alimenta o gráfico de Peso corporal em Progresso).
    const p = parseNumber(peso);
    if (p && p > 25 && p < 300 && p !== profile.pesoKg) {
      await addBodyMeasure(db, { pesoKg: p });
      await refresh();
      if (profile.healthConnect) writeWeight(p);
    }
    notify('Pronto', 'Dados atualizados.');
  };

  const setLembretes = async (patch: { lembreteTreinoDias?: number[]; lembreteTreinoHora?: number }) => {
    const next = {
      treinoDias: patch.lembreteTreinoDias ?? profile.lembreteTreinoDias,
      treinoHora: patch.lembreteTreinoHora ?? profile.lembreteTreinoHora,
    };
    const ok = await syncReminders(next);
    if (!ok && next.treinoDias.length > 0) {
      notify('Notificações bloqueadas', 'Libere as notificações do Dymra nas configurações do Android.');
      return;
    }
    await update(patch);
  };

  const toggleHealth = async (on: boolean) => {
    if (!on) {
      await update({ healthConnect: false });
      return;
    }
    if (hc !== 'disponivel') {
      notify(
        'Health Connect indisponível',
        hc === 'precisa-atualizar'
          ? 'Atualize o app Health Connect pela Play Store e tente de novo.'
          : 'O Health Connect só funciona no APK instalado no Android (não no Expo Go).',
      );
      return;
    }
    const ok = await connectHealth();
    if (ok) await update({ healthConnect: true });
    else Alert.alert('Sem permissão', 'Libere o acesso do Dymra no Health Connect.', [{ text: 'Abrir Health Connect', onPress: openHealthSettings }, { text: 'Ok' }]);
  };

  const backup = async () => {
    setBusy('backup');
    try {
      await exportBackup(db);
      await refresh();
    } catch (e) {
      notify('Erro no backup', String(e));
    } finally {
      setBusy(null);
    }
  };

  const restaurar = async () => {
    const ok = await confirmAction({
      title: 'Restaurar backup?',
      message: 'Isso SUBSTITUI todos os dados atuais deste celular pelos do arquivo.',
      confirmText: 'Escolher arquivo',
      destructive: true,
    });
    if (!ok) return;
    setBusy('restore');
    try {
      if (await importBackup(db)) {
        await refresh();
        notify('Backup restaurado', 'Seus dados voltaram!');
      }
    } catch (e) {
      notify('Não deu para restaurar', e instanceof BackupError ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const buscarAtualizacao = async () => {
    if (!Updates.isEnabled) {
      notify('Atualizações', 'Disponível só no app instalado (APK).');
      return;
    }
    setBusy('update');
    try {
      const r = await Updates.checkForUpdateAsync();
      if (!r.isAvailable) {
        notify('Tudo em dia', 'Você já está com a versão mais recente.');
        return;
      }
      await Updates.fetchUpdateAsync();
      Alert.alert('Atualização baixada', 'O app vai reiniciar para aplicar.', [{ text: 'Reiniciar', onPress: () => Updates.reloadAsync() }]);
    } catch (e) {
      notify('Não deu para atualizar', String(e));
    } finally {
      setBusy(null);
    }
  };

  const program = useProgram(profile.programaId);

  return (
    <Screen>
      <Txt variant="h1">Perfil</Txt>

      <Recolhivel titulo="Seus dados" icon="person-circle-outline" resumo={`${profile.nome} · ${formatInput(profile.alturaCm)} cm · ${formatInput(profile.pesoKg)} kg · ${GOAL_LABELS[profile.objetivo]}`}>
        <TextField label="Nome" value={nome} onChangeText={setNome} />
        <Row gap={spacing.md}>
          <TextField label="Altura" value={altura} onChangeText={setAltura} keyboardType="number-pad" suffix="cm" />
          <TextField label="Peso" value={peso} onChangeText={setPeso} keyboardType="decimal-pad" suffix="kg" />
        </Row>
        <Button small variant="secondary" title="Salvar dados" onPress={salvarDados} />
        <Divider />
        <Txt variant="label">Objetivo</Txt>
        <Row wrap>
          {GOALS.map((g) => (
            <Chip key={g} label={GOAL_LABELS[g]} active={profile.objetivo === g} onPress={() => update({ objetivo: g })} />
          ))}
        </Row>
        <Divider />
        <Linha label="Ficha atual">
          <Chip label={program?.nome ?? 'Nenhuma'} onPress={() => router.push('/treinos')} />
        </Linha>
      </Recolhivel>

      <Recolhivel
        titulo="Treino"
        icon="barbell-outline"
        resumo={`Descanso ${profile.descansoPadraoSeg}s · meta ${profile.metaSemanal ?? 3}x por semana${profile.sugerirAquecimento ? ' · com aquecimento' : ''}`}>
        <Txt variant="label">Descanso padrão</Txt>
        <Stepper
          value={profile.descansoPadraoSeg}
          onChange={(v) => v != null && update({ descansoPadraoSeg: Math.max(15, Math.round(v)) })}
          step={15}
          min={15}
          suffix="s"
          decimals={false}
        />
        <Linha label="Sugerir séries de aquecimento">
          <Switch
            value={profile.sugerirAquecimento}
            onValueChange={(v) => update({ sugerirAquecimento: v })}
            trackColor={{ true: colors.accent, false: colors.surface2 }}
          />
        </Linha>
        <Txt variant="label">Meta de treinos por semana</Txt>
        <Stepper
          value={profile.metaSemanal ?? 3}
          onChange={(v) => v != null && update({ metaSemanal: Math.min(7, Math.max(1, Math.round(v))) })}
          step={1}
          min={1}
          suffix="x"
          decimals={false}
        />
      </Recolhivel>

      <Recolhivel
        titulo="Lembrete de treino"
        icon="alarm-outline"
        resumo={
          profile.lembreteTreinoDias.length === 0
            ? 'Desligado'
            : `${profile.lembreteTreinoDias.map((d) => DIAS[d]).join(', ')} · ${profile.lembreteTreinoHora}h`
        }>
        <Row wrap gap={6}>
          {DIAS.map((d, i) => {
            const on = profile.lembreteTreinoDias.includes(i);
            return (
              <Chip
                key={d}
                label={d}
                active={on}
                onPress={() =>
                  setLembretes({
                    lembreteTreinoDias: on
                      ? profile.lembreteTreinoDias.filter((x) => x !== i)
                      : [...profile.lembreteTreinoDias, i].sort(),
                  })
                }
              />
            );
          })}
        </Row>
        <Txt variant="label">Horário</Txt>
        <Stepper
          value={profile.lembreteTreinoHora}
          onChange={(v) => v != null && setLembretes({ lembreteTreinoHora: Math.min(23, Math.max(5, Math.round(v))) })}
          step={1}
          min={5}
          suffix="h"
          decimals={false}
        />
      </Recolhivel>

      <Card>
        <Row>
          <Icon name="heart-circle-outline" color={colors.danger} />
          <Txt variant="h3">Health Connect</Txt>
        </Row>
        <Linha label={hc === 'disponivel' ? 'Conectar' : hc === 'precisa-atualizar' ? 'Atualize o Health Connect' : 'Indisponível neste aparelho'}>
          <Switch
            value={profile.healthConnect}
            onValueChange={toggleHealth}
            trackColor={{ true: colors.danger, false: colors.surface2 }}
          />
        </Linha>
        {profile.healthConnect ? <Button small variant="ghost" title="Gerenciar permissões" onPress={openHealthSettings} /> : null}
      </Card>

      <Card>
        <Row>
          <Icon name="cloud-upload-outline" color={colors.violet} />
          <Txt variant="h3">Backup</Txt>
        </Row>
        <Txt variant="small" color={colors.muted}>
          Salve no Drive ou WhatsApp para não perder nada.
        </Txt>
        <Txt variant="tiny">
          Último backup: {profile.ultimoBackupEm ? formatDateLong(profile.ultimoBackupEm) : 'nunca'}
        </Txt>
        <Row>
          <Button title="Fazer backup" variant="violet" onPress={backup} loading={busy === 'backup'} style={{ flex: 1 }} />
          <Button title="Restaurar" variant="ghost" onPress={restaurar} loading={busy === 'restore'} style={{ flex: 1 }} />
        </Row>
      </Card>

      <Card>
        <Txt variant="h3">Sobre</Txt>
        <Txt variant="small" color={colors.muted}>
          Dymra {Constants.expoConfig?.version ?? ''} · catálogo {CATALOG_VERSION}
        </Txt>
        <Button small variant="secondary" icon="refresh" title="Procurar atualização" onPress={buscarAtualizacao} loading={busy === 'update'} />
      </Card>
    </Screen>
  );
}
