// ─────────────────────────────────────────────────────────────
//  KitsuyStore — ClientModal Component
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import type { Client } from "../../types";
import { Button } from "../ui/Button";

type ClientFormData = Omit<Client, "id" | "createdAt">;
const EMPTY: ClientFormData = { name: "", phone: "", address: "", notes: "" };

interface ClientModalProps {
  mode: "add" | "edit";
  data?: Client;
  onSave: (data: Client | ClientFormData) => void;
  onClose: () => void;
}

export function ClientModal({ mode, data, onSave, onClose }: ClientModalProps) {
  const [f, setF] = useState<ClientFormData>({ ...EMPTY, ...data });
  const set = <K extends keyof ClientFormData>(key: K) => (value: ClientFormData[K]) =>
    setF(prev => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (!f.name.trim()) { alert("Nome é obrigatório."); return; }
    onSave(data ? { ...f, id: data.id, createdAt: data.createdAt } : f);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">
          {mode === "add" ? "🌸 Novo Cliente" : "✏️ Editar Cliente"}
        </div>
        <div className="form-group">
          <div className="form-field">
            <label>Nome *</label>
            <input value={f.name} onChange={e => set("name")(e.target.value)} placeholder="Nome completo" />
          </div>
          <div className="form-field">
            <label>📱 WhatsApp</label>
            <input value={f.phone} onChange={e => set("phone")(e.target.value)} placeholder="(00) 00000-0000" />
          </div>
          <div className="form-field">
            <label>📍 Endereço de Entrega</label>
            <input value={f.address} onChange={e => set("address")(e.target.value)} placeholder="Rua, número, bairro, cidade" />
          </div>
          <div className="form-field">
            <label>📝 Observações</label>
            <textarea value={f.notes} onChange={e => set("notes")(e.target.value)} rows={2} placeholder="Anotações sobre o cliente..." />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" onClick={handleSave}>
              {mode === "add" ? "🌸 Cadastrar" : "💾 Salvar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
