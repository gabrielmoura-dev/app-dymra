import { useState } from 'react';
import { Linking, View, type LayoutChangeEvent } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

import type { YouTubeVideo } from '@/catalog/types';
import { colors, radius, spacing } from '@/theme';

import { Button, Icon, Txt } from './ui';

/** Player do YouTube dentro do app (precisa de internet). */
export function VideoPlayer({ video }: { video?: YouTubeVideo }) {
  const [width, setWidth] = useState(0);
  const [erro, setErro] = useState(false);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  if (!video) {
    return (
      <View style={styles.placeholder}>
        <Icon name="videocam-outline" size={32} color={colors.faint} />
        <Txt variant="small" color={colors.muted} center>
          Vídeo ainda não cadastrado para este exercício.
        </Txt>
      </View>
    );
  }

  const url = `https://www.youtube.com/watch?v=${video.youtubeId}${video.inicio ? `&t=${video.inicio}s` : ''}`;

  if (erro) {
    return (
      <View style={styles.placeholder}>
        <Icon name="cloud-offline-outline" size={32} color={colors.faint} />
        <Txt variant="small" color={colors.muted} center>
          Não deu para tocar aqui (sem internet ou o vídeo não permite reprodução em outros apps).
        </Txt>
        <Button small variant="secondary" icon="logo-youtube" title="Abrir no YouTube" onPress={() => Linking.openURL(url)} />
      </View>
    );
  }

  return (
    <View onLayout={onLayout} style={{ borderRadius: radius.md, overflow: 'hidden', backgroundColor: '#000' }}>
      {width > 0 ? (
        <YoutubePlayer
          height={Math.round((width * 9) / 16)}
          width={width}
          videoId={video.youtubeId}
          initialPlayerParams={{ start: video.inicio, end: video.fim, rel: false, preventFullScreen: false }}
          onError={() => setErro(true)}
        />
      ) : (
        <View style={{ aspectRatio: 16 / 9 }} />
      )}
    </View>
  );
}

const styles = {
  placeholder: {
    aspectRatio: 16 / 9,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: spacing.sm,
    padding: spacing.lg,
  },
};
