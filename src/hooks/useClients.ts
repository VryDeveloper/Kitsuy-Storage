import { useState, useEffect, useCallback } from 'react';
import type { Client } from '../types';
import { ClientService } from '../services/storage';


export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);


  const load = useCallback(async () => {
    try {
      setLoading(true);
      setClients(await ClientService.getAll());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);


  useEffect(() => { load(); }, [load]);


  const addClient = async (data: Omit<Client,'id'|'createdAt'>) => {
    const created = await ClientService.create(data);
    setClients(prev => [created, ...prev]);
  };
  const updateClient = async (updated: Client) => {
    const saved = await ClientService.update(updated);
    setClients(prev => prev.map(c => c.id===saved.id ? saved : c));
  };
  const deleteClient = async (id: string) => {
    await ClientService.delete(id);
    setClients(prev => prev.filter(c => c.id !== id));
  };


  return { clients, loading, error,
           addClient, updateClient, deleteClient };
}
