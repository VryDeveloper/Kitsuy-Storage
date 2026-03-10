import { supabase } from './supabase';
import type { Order, Client } from '../types';


// ── Mapeamento banco (snake_case) ↔ app (camelCase) ──
const toOrder = (row: any): Order => ({
  id:               row.id,
  createdAt:        row.created_at,
  productName:      row.product_name,
  clientId:         row.client_id ?? '',
  purchasePrice:    String(row.purchase_price ?? 0),
  purchaseLink:     row.purchase_link ?? '',
  shippingCost:     String(row.shipping_cost ?? 0),
  marginType:       row.margin_type ?? 'fixed',
  marginValue:      String(row.margin_value ?? 150),
  discountValue:    String(row.discount_value ?? 0),
  salePrice:        String(row.sale_price ?? 0),
  orderDate:        row.order_date ?? '',
  shippingStatus:   row.shipping_status ?? 'pending',
  paymentMode:      row.payment_mode ?? 'installment',
  depositPaid:      row.deposit_paid ?? false,
  finalPaymentPaid: row.final_payment_paid ?? false,
  notes:            row.notes ?? '',
});


const toClient = (row: any): Client => ({
  id: row.id, createdAt: row.created_at,
  name: row.name, phone: row.phone ?? '',
  address: row.address ?? '', notes: row.notes ?? '',
});


const fromOrder = (o: Omit<Order,'id'|'createdAt'>) => ({
  product_name:       o.productName,
  client_id:          o.clientId || null,
  purchase_price:     parseFloat(o.purchasePrice) || 0,
  purchase_link:      o.purchaseLink,
  shipping_cost:      parseFloat(o.shippingCost) || 0,
  margin_type:        o.marginType,
  margin_value:       parseFloat(o.marginValue) || 0,
  discount_value:     parseFloat(o.discountValue) || 0,
  sale_price:         parseFloat(o.salePrice) || 0,
  order_date:         o.orderDate || null,
  shipping_status:    o.shippingStatus,
  payment_mode:       o.paymentMode,
  deposit_paid:       o.depositPaid,
  final_payment_paid: o.finalPaymentPaid,
  notes:              o.notes,
});


const fromClient = (c: Omit<Client,'id'|'createdAt'>) => ({
  name: c.name, phone: c.phone,
  address: c.address, notes: c.notes,
});


// ── Orders ──────────────────────────────────────────
export const OrderService = {
  async getAll(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders').select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toOrder);
  },
  async create(o: Omit<Order,'id'|'createdAt'>): Promise<Order> {
    const { data, error } = await supabase
      .from('orders').insert(fromOrder(o)).select().single();
    if (error) throw error;
    return toOrder(data);
  },
  async update(o: Order): Promise<Order> {
    const { data, error } = await supabase
      .from('orders').update(fromOrder(o))
      .eq('id', o.id).select().single();
    if (error) throw error;
    return toOrder(data);
  },
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('orders').delete().eq('id', id);
    if (error) throw error;
  },
};


// ── Clients ─────────────────────────────────────────
export const ClientService = {
  async getAll(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients').select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toClient);
  },
  async create(c: Omit<Client,'id'|'createdAt'>): Promise<Client> {
    const { data, error } = await supabase
      .from('clients').insert(fromClient(c)).select().single();
    if (error) throw error;
    return toClient(data);
  },
  async update(c: Client): Promise<Client> {
    const { data, error } = await supabase
      .from('clients').update(fromClient(c))
      .eq('id', c.id).select().single();
    if (error) throw error;
    return toClient(data);
  },
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('clients').delete().eq('id', id);
    if (error) throw error;
  },
};
