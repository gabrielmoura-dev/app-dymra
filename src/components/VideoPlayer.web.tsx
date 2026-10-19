import { createElement } from 'react';
import { View } from 'react-native';

import type { YouTubeVideo } from '@/catalog/types';
import { colors, radius, spacing } from '@/theme';

import { Icon, Txt } from './ui';

/** Versão web (só para testes no navegador): usa um iframe simples. */
export function VideoPlayer({ video }: { video?: YouTubeVideo }) {
  if (!video) {
    return (
      <View
        style={{
          aspectRatio: 16 / 9,
          borderRadius: radius.md,
          backgroundColor: colors.surface2,
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          padding: spacing.lg,
        }}>
        <Icon name="videocam-outline" size={32} color={colors.faint} />
        <Txt variant="small" color={colors.muted} center>
          Vídeo ainda não cadastrado para este exercício.
        </Txt>
      </View>
    );
  }
  const params = new URLSearchParams({ rel: '0' });
  if (video.inicio) params.set('start', String(video.inicio));
  if (video.fim) params.set('end', String(video.fim));
  return (
    <View style={{ aspectRatio: 16 / 9, borderRadius: radius.md, overflow: 'hidden' }}>
      {createElement('iframe', {
        src: `https://www.youtube-nocookie.com/embed/${video.youtubeId}?${params.toString()}`,
        style: { width: '100%', height: '100%', border: 0 },
        allow: 'accelerometer; encrypted-media; picture-in-picture',
        allowFullScreen: true,
      })}
    </View>
  );
}
