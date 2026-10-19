import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import { File } from 'expo-file-system';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Empty, Icon, IconButton, Row, Screen, Txt } from '@/components/ui';
import { addProgressPhoto, listProgressPhotos, type PhotoPose } from '@/db/repo';
import { newPhotoFile, photoUri } from '@/services/photos';
import { colors, spacing } from '@/theme';

/**
 * Câmera com a foto anterior (mesma pose) sobreposta em transparência,
 * para tirar as fotos sempre no mesmo enquadramento.
 */
export default function CameraFoto() {
  const { pose } = useLocalSearchParams<{ pose: PhotoPose }>();
  const db = useSQLiteContext();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [ghost, setGhost] = useState<string | null>(null);
  const [showGhost, setShowGhost] = useState(true);
  const [busy, setBusy] = useState(false);
  const cam = useRef<CameraView>(null);

  useEffect(() => {
    listProgressPhotos(db).then((ps) => {
      const last = ps.find((p) => p.pose === pose);
      setGhost(last ? photoUri(last.arquivo) : null);
    });
  }, [db, pose]);

  if (!permission) return <Screen>{null}</Screen>;
  if (!permission.granted) {
    return (
      <Screen>
        <Empty icon="camera-outline" title="Precisamos da câmera" />
        <Button title="Permitir câmera" onPress={requestPermission} />
      </Screen>
    );
  }

  const capturar = async () => {
    if (!cam.current || busy) return;
    setBusy(true);
    try {
      const pic = await cam.current.takePictureAsync({ quality: 0.7 });
      if (!pic) return;
      const { nome, file } = newPhotoFile();
      await new File(pic.uri).copy(file);
      await addProgressPhoto(db, nome, pose ?? 'frente');
      router.back();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView ref={cam} style={{ flex: 1 }} facing={facing} />
      {ghost && showGhost ? (
        <Image
          source={{ uri: ghost }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.35 }}
          contentFit="cover"
          pointerEvents="none"
        />
      ) : null}
      <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }} edges={['top']}>
        <Row style={{ justifyContent: 'space-between', padding: spacing.lg }}>
          <IconButton icon="close" label="Fechar" onPress={() => router.back()} bg="rgba(0,0,0,0.5)" />
          <Txt bold>Foto de {pose}</Txt>
          <IconButton
            icon="camera-reverse-outline"
            label="Trocar câmera"
            onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
            bg="rgba(0,0,0,0.5)"
          />
        </Row>
        {ghost ? (
          <Txt variant="tiny" center color={colors.text}>
            Alinhe seu corpo com a foto anterior (transparente)
          </Txt>
        ) : (
          <Txt variant="tiny" center color={colors.text}>
            Primeira foto desta pose: escolha um lugar com boa luz e repita sempre.
          </Txt>
        )}
      </SafeAreaView>
      <SafeAreaView style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} edges={['bottom']}>
        <Row style={{ justifyContent: 'space-around', padding: spacing.xl }}>
          {ghost ? (
            <IconButton
              icon={showGhost ? 'eye-off-outline' : 'eye-outline'}
              label="Mostrar ou esconder guia"
              onPress={() => setShowGhost((v) => !v)}
              bg="rgba(0,0,0,0.5)"
            />
          ) : (
            <View style={{ width: 40 }} />
          )}
          <Pressable
            accessibilityLabel="Tirar foto"
            onPress={capturar}
            style={{
              width: 76,
              height: 76,
              borderRadius: 38,
              borderWidth: 5,
              borderColor: colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: busy ? 0.5 : 1,
            }}>
            <Icon name="ellipse" size={54} color={colors.text} />
          </Pressable>
          <View style={{ width: 40 }} />
        </Row>
      </SafeAreaView>
    </View>
  );
}
