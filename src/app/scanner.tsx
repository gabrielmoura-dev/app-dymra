import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef } from 'react';
import { View } from 'react-native';

import { Button, Empty, Screen, Txt } from '@/components/ui';
import { machineIdFromQr } from '@/logic/qr';
import { colors, radius, spacing } from '@/theme';

export default function Scanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const done = useRef(false);

  if (!permission) return <Screen edges={['bottom']}>{null}</Screen>;

  if (!permission.granted) {
    return (
      <Screen edges={['bottom']}>
        <Empty icon="camera-outline" title="Precisamos da câmera" text="Para ler o QR code colado nas máquinas." />
        <Button title="Permitir câmera" onPress={requestPermission} />
      </Screen>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={({ data }) => {
          if (done.current) return;
          const id = machineIdFromQr(data);
          if (!id) return;
          done.current = true;
          router.replace(`/maquina/${id}`);
        }}
      />
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 240, height: 240, borderRadius: radius.lg, borderWidth: 3, borderColor: colors.accent }} />
        <Txt center style={{ marginTop: spacing.lg, paddingHorizontal: spacing.xl }}>
          Aponte para o QR code da máquina
        </Txt>
      </View>
    </View>
  );
}
