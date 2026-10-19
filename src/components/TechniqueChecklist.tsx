import { View } from 'react-native';

import type { Technique } from '@/catalog/types';
import { colors, spacing } from '@/theme';

import { Bullet, Icon, Row, Txt } from './ui';

function Bloco({ icon, titulo, children, color = colors.accent }: { icon: Parameters<typeof Icon>[0]['name']; titulo: string; children: React.ReactNode; color?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Row gap={6}>
        <Icon name={icon} size={16} color={color} />
        <Txt variant="label" color={color}>
          {titulo}
        </Txt>
      </Row>
      <View style={{ gap: 6, paddingLeft: 2 }}>{children}</View>
    </View>
  );
}

/** Pontos-chave para checar antes de cada série (versão curta, usada no treino). */
export function TechniqueQuick({ t }: { t: Technique }) {
  const itens: [Parameters<typeof Icon>[0]['name'], string][] = [];
  if (t.escapulas) itens.push(['git-merge-outline', t.escapulas]);
  if (t.core) itens.push(['shield-checkmark-outline', t.core]);
  itens.push(['cloud-outline', t.respiracao]);
  if (t.cadencia) itens.push(['timer-outline', t.cadencia]);
  return (
    <View style={{ gap: 8 }}>
      {itens.map(([icon, txt]) => (
        <Bullet key={txt} icon={icon} color={colors.accent}>
          <Txt variant="small">{txt}</Txt>
        </Bullet>
      ))}
    </View>
  );
}

/** Checklist completo da ficha do exercício. */
export function TechniqueFull({ t }: { t: Technique }) {
  return (
    <View style={{ gap: spacing.lg }}>
      <Bloco icon="construct-outline" titulo="Ajuste da máquina">
        {t.ajuste.map((s) => (
          <Bullet key={s}>{s}</Bullet>
        ))}
      </Bloco>
      <Bloco icon="footsteps-outline" titulo="Passo a passo">
        {t.execucao.map((s, i) => (
          <Row key={s} style={{ alignItems: 'flex-start' }}>
            <Txt bold color={colors.accent} style={{ width: 18 }}>
              {i + 1}.
            </Txt>
            <Txt style={{ flex: 1 }}>{s}</Txt>
          </Row>
        ))}
      </Bloco>
      {t.escapulas ? (
        <Bloco icon="git-merge-outline" titulo="Escápulas" color={colors.violet}>
          <Txt>{t.escapulas}</Txt>
        </Bloco>
      ) : null}
      {t.core ? (
        <Bloco icon="shield-checkmark-outline" titulo="Abdômen e postura" color={colors.violet}>
          <Txt>{t.core}</Txt>
        </Bloco>
      ) : null}
      <Bloco icon="cloud-outline" titulo="Respiração" color={colors.water}>
        <Txt>{t.respiracao}</Txt>
      </Bloco>
      {t.cadencia ? (
        <Bloco icon="timer-outline" titulo="Velocidade" color={colors.water}>
          <Txt>{t.cadencia}</Txt>
        </Bloco>
      ) : null}
      <Bloco icon="close-circle-outline" titulo="Erros comuns" color={colors.warning}>
        {t.errosComuns.map((s) => (
          <Bullet key={s} icon="close" color={colors.warning}>
            {s}
          </Bullet>
        ))}
      </Bloco>
      {t.seguranca?.length ? (
        <Bloco icon="warning-outline" titulo="Segurança" color={colors.danger}>
          {t.seguranca.map((s) => (
            <Bullet key={s} icon="alert" color={colors.danger}>
              {s}
            </Bullet>
          ))}
          <Bullet icon="alert" color={colors.danger}>
            Dor nas articulações (joelho, ombro, lombar) é sinal para parar. Ardência no músculo é normal.
          </Bullet>
        </Bloco>
      ) : (
        <Bloco icon="warning-outline" titulo="Segurança" color={colors.danger}>
          <Bullet icon="alert" color={colors.danger}>
            Dor nas articulações (joelho, ombro, lombar) é sinal para parar. Ardência no músculo é normal.
          </Bullet>
        </Bloco>
      )}
    </View>
  );
}
