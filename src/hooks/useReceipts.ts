import { useState, useEffect, useCallback } from 'react';
import type { PaymentReceipt, ReceiptFormData } from '../types';
import { ReceiptService } from '../services/storage';


export function useReceipts() {
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);


  const load = useCallback(async () => {
    try {
      setLoading(true);
      setReceipts(await ReceiptService.getAll());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);


  useEffect(() => { load(); }, [load]);


  const addReceipt = async (file: File, data: ReceiptFormData) => {
    const created = await ReceiptService.create(file, data);
    setReceipts(prev => [created, ...prev]);
  };
  const updateReceipt = async (updated: PaymentReceipt) => {
    const saved = await ReceiptService.update(updated);
    setReceipts(prev => prev.map(r => r.id===saved.id ? saved : r));
  };
  const deleteReceipt = async (r: PaymentReceipt) => {
    await ReceiptService.delete(r);
    setReceipts(prev => prev.filter(x => x.id !== r.id));
  };
  // Pedidos apagados somem dos vínculos no banco (CASCADE) — espelha aqui
  const forgetOrder = (orderId: string) =>
    setReceipts(prev => prev.map(r => ({ ...r, orderIds: r.orderIds.filter(id => id !== orderId) })));


  return { receipts, loading, error,
           addReceipt, updateReceipt, deleteReceipt, forgetOrder };
}
