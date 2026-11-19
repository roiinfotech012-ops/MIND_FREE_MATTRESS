import type { OrderRecord, OrderStatusType } from './orderService';

export interface PgHealthResponse {
  ok: boolean;
  engine: string;
  host: string;
  stats: {
    database: string;
    db_user: string;
    server_ip: string;
    server_port: number;
    buckets_count: number;
    files_count: number;
    products_count: number;
    pillows_count: number;
    orders_count: number;
    customers_count: number;
    reviews_count: number;
    content_count: number;
    subscribers_count: number;
    inquiries_count: number;
  };
}

export interface PgStorageBucket {
  id: string;
  name: string;
  is_public: boolean;
  file_size_limit: number;
  description: string;
  object_count: number;
  created_at: string;
}

export interface PgStorageObject {
  id: number;
  bucket_id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  public_url: string;
  alt_text: string;
  uploaded_by: string;
  created_at: string;
}

export interface PgProductRecord {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  short_description?: string;
  categories: string[];
  top_finish_style: string;
  warranty_months: number;
  starting_price: number;
  max_price?: number;
  mrp_price: number;
  hero_image: string;
  cooling_image?: string | null;
  thickness_options: number[];
  features?: string[];
  is_active: boolean;
  created_at: string;
}

export interface PgSiteContentRecord {
  id: number;
  section_key: string;
  title: string;
  subtitle: string;
  badge_text: string;
  cta_text: string;
  cta_link: string;
  image_url: string;
  content_json: Record<string, unknown>;
  updated_at: string;
}

const API_BASE = '/api';

export async function fetchPgHealth(): Promise<PgHealthResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchOrdersFromPg(): Promise<OrderRecord[] | null> {
  try {
    const res = await fetch(`${API_BASE}/orders`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data: OrderRecord[] = await res.json();
    if (Array.isArray(data) && data.length > 0 && typeof window !== 'undefined') {
      try {
        localStorage.setItem('mindfree_orders_v1', JSON.stringify(data));
      } catch {
        // ignore storage quota errors
      }
    }
    return data;
  } catch {
    return null;
  }
}

export async function saveOrderToPg(order: OrderRecord): Promise<OrderRecord | null> {
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function updateOrderStatusInPg(
  orderId: string,
  newStatus: OrderStatusType,
  note?: string,
  extra?: {
    courierPartner?: string;
    trackingNumber?: string;
    estimatedDelivery?: string;
    updatedBy?: string;
    courierWaybill?: string;
  }
): Promise<OrderRecord | null> {
  try {
    const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newStatus,
        note,
        ...extra,
      }),
    });
    if (!res.ok) return null;
    const updated: OrderRecord = await res.json();
    return updated;
  } catch {
    return null;
  }
}

export async function fetchProductsFromPg(): Promise<PgProductRecord[]> {
  try {
    const res = await fetch(`${API_BASE}/products`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function createProductInPg(payload: Partial<PgProductRecord>): Promise<PgProductRecord | null> {
  try {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function deleteProductFromPg(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchBucketsFromPg(): Promise<PgStorageBucket[]> {
  try {
    const res = await fetch(`${API_BASE}/storage/buckets`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function createBucketInPg(payload: {
  id: string;
  name: string;
  description: string;
}): Promise<PgStorageBucket | null> {
  try {
    const res = await fetch(`${API_BASE}/storage/buckets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchStorageObjectsFromPg(bucketId?: string): Promise<PgStorageObject[]> {
  try {
    const url = bucketId
      ? `${API_BASE}/storage/objects?bucket_id=${encodeURIComponent(bucketId)}`
      : `${API_BASE}/storage/objects`;
    const res = await fetch(url);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function uploadImageToPgStorage(payload: {
  bucket_id: string;
  file_name: string;
  mime_type: string;
  base64_data: string;
  alt_text?: string;
}): Promise<PgStorageObject | null> {
  try {
    const res = await fetch(`${API_BASE}/storage/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function deleteStorageObjectFromPg(id: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/storage/objects/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchSiteContentFromPg(): Promise<PgSiteContentRecord[]> {
  try {
    const res = await fetch(`${API_BASE}/content`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function saveSiteContentToPg(
  payload: Partial<PgSiteContentRecord>
): Promise<PgSiteContentRecord | null> {
  try {
    const res = await fetch(`${API_BASE}/content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function subscribeNewsletterInPg(email: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/newsletter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function submitContactInquiryToPg(payload: {
  full_name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}
