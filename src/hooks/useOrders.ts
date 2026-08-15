import { useState, useEffect, useCallback } from 'react';
import type { Order } from '../types';
import { OrderService } from '../services/storage';


export function useOrders() {
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);


  const load = useCallback(async () => {
    try {
      setLoading(true);
      setOrders(await OrderService.getAll());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);


  useEffect(() => { load(); }, [load]);


  const addOrder = async (data: Omit<Order,'id'|'createdAt'>) => {
    const created = await OrderService.create(data);
    setOrders(prev => [created, ...prev]);
  };
  const updateOrder = async (updated: Order) => {
    const saved = await OrderService.update(updated);
    setOrders(prev => prev.map(o => o.id===saved.id ? saved : o));
  };
  const deleteOrder = async (id: string) => {
    await OrderService.delete(id);
    setOrders(prev => prev.filter(o => o.id !== id));
  };
  const getOrdersByClient = (clientId: string) =>
    orders.filter(o => o.clientId === clientId);


  return { orders, loading, error,
           addOrder, updateOrder, deleteOrder, getOrdersByClient };
}
