import type { PaymentReceipt } from "../../types";
import { ReceiptService } from "../../services/storage";

export const receiptIcon = (fileType: string) =>
  fileType === "application/pdf" ? "📄" : "🖼️";

/** Abre o comprovante numa nova aba via link temporário (bucket privado) */
export async function openReceiptFile(r: PaymentReceipt) {
  // Abre a aba antes do await para o navegador não bloquear como pop-up
  const win = window.open("", "_blank");
  try {
    const url = await ReceiptService.getFileUrl(r.filePath);
    if (win) win.location.href = url;
    else window.location.href = url;
  } catch (e: any) {
    win?.close();
    alert(`Não foi possível abrir o comprovante: ${e?.message ?? e}`);
  }
}
