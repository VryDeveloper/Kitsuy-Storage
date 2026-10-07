import { supabase } from './supabase';
import type { Order, Client, PaymentReceipt, ReceiptFormData } from '../types';


// ── Mapeamento banco (snake_case) ↔ app (camelCase) ──
const toOrder = (row: any): Order => ({
  id:               row.id,
  createdAt:        row.created_at,
  productName:      row.product_name,
  clientId:         row.client_id ?? '',
  sellerName:       row.seller_name ?? '',
  createdBy:        row.created_by ?? undefined,
  createdByName:    row.created_by_name ?? undefined,
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
  seller_name:        o.sellerName.trim() || null,
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


// ── Comprovantes de pagamento ───────────────────────
const RECEIPT_BUCKET = 'payment-receipts';
const MAX_RECEIPT_SIZE_MB = 10;
export const RECEIPT_ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];

const toReceipt = (row: any): PaymentReceipt => ({
  id:            row.id,
  createdAt:     row.created_at,
  filePath:      row.file_path,
  fileName:      row.file_name,
  fileType:      row.file_type,
  amount:        row.amount != null ? String(row.amount) : '',
  paymentDate:   row.payment_date ?? '',
  notes:         row.notes ?? '',
  clientIds:     (row.payment_receipt_clients ?? []).map((r: any) => r.client_id),
  orderIds:      (row.payment_receipt_orders  ?? []).map((r: any) => r.order_id),
  createdByName: row.created_by_name ?? undefined,
});

const RECEIPT_SELECT = '*, payment_receipt_clients(client_id), payment_receipt_orders(order_id)';

const receiptParams = (d: ReceiptFormData) => ({
  p_amount:       d.amount ? parseFloat(d.amount) || null : null,
  p_payment_date: d.paymentDate || null,
  p_notes:        d.notes.trim() || null,
  p_client_ids:   d.clientIds,
  p_order_ids:    d.orderIds,
});

export const ReceiptService = {
  async getAll(): Promise<PaymentReceipt[]> {
    const { data, error } = await supabase
      .from('payment_receipts').select(RECEIPT_SELECT)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toReceipt);
  },

  async getById(id: string): Promise<PaymentReceipt> {
    const { data, error } = await supabase
      .from('payment_receipts').select(RECEIPT_SELECT)
      .eq('id', id).single();
    if (error) throw error;
    return toReceipt(data);
  },

  /** Envia o arquivo e cria o comprovante com os vínculos (cliente obrigatório) */
  async create(file: File, d: ReceiptFormData): Promise<PaymentReceipt> {
    if (!RECEIPT_ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Formato inválido. Use PDF, PNG ou JPG.');
    }
    if (file.size > MAX_RECEIPT_SIZE_MB * 1024 * 1024) {
      throw new Error(`Arquivo muito grande. Máximo ${MAX_RECEIPT_SIZE_MB}MB.`);
    }
    if (d.clientIds.length === 0) {
      throw new Error('Vincule pelo menos um cliente ao comprovante.');
    }

    const ext = file.name.split('.').pop() || 'pdf';
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(RECEIPT_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) throw upErr;

    const { data: id, error } = await supabase.rpc('save_payment_receipt', {
      p_receipt_id: null,
      p_file_path:  path,
      p_file_name:  file.name,
      p_file_type:  file.type,
      ...receiptParams(d),
    });
    if (error) {
      // Não deixa arquivo órfão no storage se o registro falhar
      await supabase.storage.from(RECEIPT_BUCKET).remove([path]);
      throw error;
    }
    return this.getById(id as string);
  },

  /** Atualiza dados e vínculos (o arquivo em si não muda) */
  async update(r: PaymentReceipt): Promise<PaymentReceipt> {
    const { error } = await supabase.rpc('save_payment_receipt', {
      p_receipt_id: r.id,
      p_file_path:  r.filePath,
      p_file_name:  r.fileName,
      p_file_type:  r.fileType,
      ...receiptParams(r),
    });
    if (error) throw error;
    return this.getById(r.id);
  },

  async delete(r: PaymentReceipt): Promise<void> {
    const { error } = await supabase
      .from('payment_receipts').delete().eq('id', r.id);
    if (error) throw error;
    await supabase.storage.from(RECEIPT_BUCKET).remove([r.filePath]);
  },

  /** Link temporário (1h) para abrir o arquivo — o bucket é privado */
  async getFileUrl(path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from(RECEIPT_BUCKET).createSignedUrl(path, 60 * 60);
    if (error) throw error;
    return data.signedUrl;
  },
};
