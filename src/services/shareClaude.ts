import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

const CLAUDE_PACKAGE = 'com.anthropic.claude';

type RNShare = typeof import('react-native-share').default;

function rnShare(): RNShare | null {
  if (Platform.OS !== 'android') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-share').default as RNShare;
  } catch {
    return null;
  }
}

export async function isClaudeInstalled(): Promise<boolean> {
  const share = rnShare();
  if (!share) return false;
  try {
    const r = await share.isPackageInstalled(CLAUDE_PACKAGE);
    return !!r.isInstalled;
  } catch {
    return false;
  }
}

/**
 * Copia o texto para a área de transferência e abre o compartilhamento
 * com a foto + texto. A pessoa escolhe "Claude" e envia pelo próprio plano.
 * Não usa API nem chave.
 */
export async function shareToClaude(photoUri: string, prompt: string): Promise<'compartilhado' | 'so-texto'> {
  await Clipboard.setStringAsync(prompt);
  const share = rnShare();
  if (share) {
    try {
      await share.open({
        message: prompt,
        url: photoUri,
        type: 'image/jpeg',
        failOnCancel: false,
        title: 'Analisar no Claude',
      });
      return 'compartilhado';
    } catch {
      // cai no plano B
    }
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(photoUri, { mimeType: 'image/jpeg', dialogTitle: 'Analisar no Claude' });
    return 'compartilhado';
  }
  return 'so-texto';
}
