import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

const PHOTO_DIR = 'fotos';

function photoDir(): Directory {
  const dir = new Directory(Paths.document, PHOTO_DIR);
  if (!dir.exists) dir.create({ idempotent: true, intermediates: true });
  return dir;
}

/** URI de uma foto salva (o banco guarda só o nome do arquivo). */
export function photoUri(arquivo: string): string {
  return new File(Paths.document, PHOTO_DIR, arquivo).uri;
}

export function photoFile(arquivo: string): File {
  return new File(Paths.document, PHOTO_DIR, arquivo);
}

export function deletePhotoFile(arquivo: string) {
  try {
    const f = photoFile(arquivo);
    if (f.exists) f.delete();
  } catch {
    // ignorado
  }
}

/** Reserva um arquivo novo na pasta privada de fotos. */
export function newPhotoFile(): { nome: string; file: File } {
  const nome = `foto-${Date.now()}.jpg`;
  return { nome, file: new File(photoDir(), nome) };
}

/** Escolhe uma foto da galeria e copia para a pasta privada do app. */
export async function pickPhotoFromGallery(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    allowsEditing: true,
    aspect: [3, 4],
  });
  if (result.canceled || result.assets.length === 0) return null;
  const { nome, file } = newPhotoFile();
  await new File(result.assets[0].uri).copy(file);
  return nome;
}

export function writePhotoFromBase64(arquivo: string, base64: string) {
  const f = new File(photoDir(), arquivo);
  if (f.exists) f.delete();
  f.create();
  f.write(base64, { encoding: 'base64' });
}
