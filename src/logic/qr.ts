import { getMachine } from '@/catalog';

/** Conteúdo gravado no QR de cada máquina. Abre o app direto pela câmera do celular. */
export function qrContentFor(machineId: string): string {
  return `dymra://maquina/${machineId}`;
}

/** Aceita "dymra://maquina/<id>" ou só o id da máquina. */
export function machineIdFromQr(data: string): string | null {
  const m = data.match(/maquina\/([\w-]+)/);
  const id = m ? m[1] : data.trim();
  return getMachine(id) ? id : null;
}
