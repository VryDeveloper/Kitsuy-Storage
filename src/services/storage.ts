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
  imageUrl:         row.image_url ?? '',
  purchasePriceYen: row.purchase_price_yen != null ? String(row.purchase_price_yen) : undefined,
  exchangeRate:     row.exchange_rate != null ? String(row.exchange_rate) : undefined,
  wiseFeePercent:   row.wise_fee_percent != null ? String(row.wise_fee_percent) : undefined,
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
  image_url:          o.imageUrl || null,
  purchase_price_yen: o.purchasePriceYen != null ? parseFloat(o.purchasePriceYen) || 0 : null,
  exchange_rate:      o.exchangeRate != null ? parseFloat(o.exchangeRate) || 0 : null,
  wise_fee_percent:   o.wiseFeePercent != null ? parseFloat(o.wiseFeePercent) || 0 : null,
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


// ── Upload de imagem do produto ──────────────────────
const IMAGE_BUCKET = 'order-images';
const MAX_IMAGE_SIZE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const ImageService = {
  /** Faz upload da imagem e retorna a URL pública */
  async upload(file: File): Promise<string> {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Formato inválido. Use JPG, PNG, WEBP ou GIF.');
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      throw new Error(`Imagem muito grande. Máximo ${MAX_IMAGE_SIZE_MB}MB.`);
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;

    const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  },

  /** Remove uma imagem do storage a partir da URL pública */
  async remove(url: string): Promise<void> {
    if (!url) return;
    const path = url.split(`${IMAGE_BUCKET}/`).pop();
    if (!path) return;
    await supabase.storage.from(IMAGE_BUCKET).remove([path]);
  },
};


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
