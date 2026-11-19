import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Direct PostgreSQL Connection Pool (localhost:5432 / mindf31)
const connectionString =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRESQL_URL;
const sslEnabled =
  process.env.DB_SSL === 'true' ||
  process.env.PGSSL === 'true' ||
  (connectionString ? connectionString.includes('sslmode=require') : false);

const pool = new pg.Pool(
  connectionString
    ? {
        connectionString,
        ssl: sslEnabled ? { rejectUnauthorized: false } : false,
        max: parseInt(process.env.DB_POOL_MAX || '20', 10),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }
    : {
        host: process.env.DB_HOST || process.env.PGHOST || process.env.PG_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || process.env.PGPORT || process.env.PG_PORT || '5432', 10),
        database: process.env.DB_NAME || process.env.PGDATABASE || process.env.PG_DATABASE || 'mindf31',
        user: process.env.DB_USER || process.env.PGUSER || process.env.PG_USER || 'mindf31',
        password:
          process.env.DB_PASSWORD ||
          process.env.PGPASSWORD ||
          process.env.PG_PASSWORD ||
          'IgLgwJQIIOqHvnjWSG42IPpXQ',
        ssl: sslEnabled ? { rejectUnauthorized: false } : false,
        max: parseInt(process.env.DB_POOL_MAX || '20', 10),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }
);

// Auto-initialize PostgreSQL schema on cold start so any fresh cloud DB (Neon, Vercel Postgres, Railway, VPS) works immediately
let schemaInitPromise = null;
async function ensureSchemaReady() {
  if (!schemaInitPromise) {
    schemaInitPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS storage_buckets (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          is_public BOOLEAN DEFAULT TRUE,
          file_size_limit BIGINT DEFAULT 10485760,
          description TEXT DEFAULT '',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS storage_objects (
          id SERIAL PRIMARY KEY,
          bucket_id TEXT NOT NULL,
          file_name TEXT NOT NULL,
          mime_type TEXT DEFAULT 'image/png',
          size_bytes BIGINT DEFAULT 0,
          base64_data TEXT NOT NULL,
          public_url TEXT NOT NULL,
          alt_text TEXT DEFAULT '',
          uploaded_by TEXT DEFAULT 'Mindfree Admin',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(bucket_id, file_name)
        );
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          slug TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          tagline TEXT DEFAULT '',
          categories TEXT[] DEFAULT ARRAY['orthopedic'],
          top_finish_style TEXT DEFAULT 'Euro Top',
          warranty_months INT DEFAULT 60,
          starting_price NUMERIC DEFAULT 12999,
          mrp_price NUMERIC DEFAULT 14999,
          hero_image TEXT DEFAULT '/images/products/product-deluxe.jpg',
          cooling_image TEXT,
          thickness_options INT[] DEFAULT ARRAY[6, 8],
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS pillows_accessories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          tagline TEXT DEFAULT '',
          price NUMERIC DEFAULT 1999,
          image TEXT DEFAULT '',
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS orders (
          order_id TEXT PRIMARY KEY,
          customer_email TEXT DEFAULT '',
          customer_phone TEXT DEFAULT '',
          customer_info JSONB DEFAULT '{}'::jsonb,
          items JSONB DEFAULT '[]'::jsonb,
          subtotal NUMERIC DEFAULT 0,
          total_savings NUMERIC DEFAULT 0,
          shipping NUMERIC DEFAULT 0,
          tax NUMERIC DEFAULT 0,
          total NUMERIC DEFAULT 0,
          payment_method TEXT DEFAULT 'upi',
          payment_status TEXT DEFAULT 'Paid',
          order_status TEXT DEFAULT 'Confirmed',
          tracking_number TEXT DEFAULT '',
          courier_partner TEXT DEFAULT '',
          estimated_delivery TEXT DEFAULT '',
          status_history JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS customers (
          id SERIAL PRIMARY KEY,
          email TEXT UNIQUE,
          full_name TEXT DEFAULT '',
          phone TEXT DEFAULT '',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS reviews (
          id TEXT PRIMARY KEY,
          customer_name TEXT NOT NULL,
          rating INT DEFAULT 5,
          review_text TEXT,
          review_date TEXT DEFAULT '',
          is_verified BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS site_content (
          id SERIAL PRIMARY KEY,
          section_key TEXT UNIQUE NOT NULL,
          title TEXT NOT NULL,
          subtitle TEXT DEFAULT '',
          badge_text TEXT DEFAULT '',
          cta_text TEXT DEFAULT '',
          cta_link TEXT DEFAULT '',
          image_url TEXT DEFAULT '',
          content_json JSONB DEFAULT '{}'::jsonb,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS newsletter_subscribers (
          id SERIAL PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          source TEXT DEFAULT 'footer',
          subscribed_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS contact_inquiries (
          id SERIAL PRIMARY KEY,
          full_name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT DEFAULT '',
          subject TEXT DEFAULT 'General Concierge Inquiry',
          message TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
    })().catch((err) => {
      schemaInitPromise = null;
      throw err;
    });
  }
  return schemaInitPromise;
}

app.use('/api', async (req, res, next) => {
  if (!req.path.startsWith('/storage/') || req.path === '/storage/buckets' || req.path === '/storage/objects' || req.path === '/storage/upload') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  try {
    await ensureSchemaReady();
  } catch (err) {
    console.warn('Database schema init warning:', err.message);
  }
  next();
});

// 1. HEALTH & DATABASE METRICS ENDPOINT
app.get('/api/health', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        current_database() AS database,
        current_user AS db_user,
        inet_server_addr()::text AS server_ip,
        inet_server_port() AS server_port,
        (SELECT COUNT(*)::int FROM storage_buckets) AS buckets_count,
        (SELECT COUNT(*)::int FROM storage_objects) AS files_count,
        (SELECT COUNT(*)::int FROM products) AS products_count,
        (SELECT COUNT(*)::int FROM pillows_accessories) AS pillows_count,
        (SELECT COUNT(*)::int FROM orders) AS orders_count,
        (SELECT COUNT(*)::int FROM customers) AS customers_count,
        (SELECT COUNT(*)::int FROM reviews) AS reviews_count,
        (SELECT COUNT(*)::int FROM site_content) AS content_count,
        (SELECT COUNT(*)::int FROM newsletter_subscribers) AS subscribers_count,
        (SELECT COUNT(*)::int FROM contact_inquiries) AS inquiries_count
    `);
    res.json({
      ok: true,
      engine: 'PostgreSQL Direct (No Supabase)',
      host: process.env.DB_HOST || process.env.PGHOST || process.env.PG_HOST || 'localhost',
      stats: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 2. STORAGE BUCKETS & OBJECTS (Native PostgreSQL Storage)
app.get('/api/storage/buckets', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT b.*,
        (SELECT COUNT(*)::int FROM storage_objects o WHERE o.bucket_id = b.id) AS object_count
      FROM storage_buckets b
      ORDER BY b.created_at ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/storage/buckets', async (req, res) => {
  try {
    const { id, name, description, is_public = true } = req.body;
    const bucketId = (id || name || '').toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    if (!bucketId) return res.status(400).json({ error: 'Bucket ID/Name is required' });

    const { rows } = await pool.query(
      `INSERT INTO storage_buckets (id, name, is_public, description)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         description = EXCLUDED.description,
         is_public = EXCLUDED.is_public,
         updated_at = NOW()
       RETURNING *`,
      [bucketId, name || bucketId, is_public, description || '']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/storage/objects', async (req, res) => {
  try {
    const { bucket_id } = req.query;
    const query = bucket_id
      ? `SELECT id, bucket_id, file_name, mime_type, size_bytes, public_url, alt_text, uploaded_by, created_at
         FROM storage_objects WHERE bucket_id = $1 ORDER BY created_at DESC`
      : `SELECT id, bucket_id, file_name, mime_type, size_bytes, public_url, alt_text, uploaded_by, created_at
         FROM storage_objects ORDER BY created_at DESC`;
    const params = bucket_id ? [bucket_id] : [];
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/storage/upload', async (req, res) => {
  try {
    const {
      bucket_id = 'media-uploads',
      file_name,
      mime_type = 'image/png',
      base64_data,
      alt_text = '',
      uploaded_by = 'Mindfree Admin',
    } = req.body;

    if (!file_name || !base64_data) {
      return res.status(400).json({ error: 'file_name and base64_data are required' });
    }

    const cleanBase64 = base64_data.includes('base64,')
      ? base64_data.split('base64,')[1]
      : base64_data;
    const sizeBytes = Buffer.byteLength(cleanBase64, 'base64');
    const safeFileName = file_name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const publicUrl = `/api/storage/${bucket_id}/${safeFileName}?v=${Date.now()}`;

    await pool.query(
      `INSERT INTO storage_buckets (id, name, is_public, description)
       VALUES ($1, $1, true, 'Auto-created media bucket')
       ON CONFLICT (id) DO NOTHING`,
      [bucket_id]
    );

    const { rows } = await pool.query(
      `INSERT INTO storage_objects (bucket_id, file_name, mime_type, size_bytes, base64_data, public_url, alt_text, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (bucket_id, file_name) DO UPDATE SET
         mime_type = EXCLUDED.mime_type,
         size_bytes = EXCLUDED.size_bytes,
         base64_data = EXCLUDED.base64_data,
         public_url = EXCLUDED.public_url,
         alt_text = EXCLUDED.alt_text,
         created_at = NOW()
       RETURNING id, bucket_id, file_name, mime_type, size_bytes, public_url, alt_text, uploaded_by, created_at`,
      [bucket_id, safeFileName, mime_type, sizeBytes, cleanBase64, publicUrl, alt_text, uploaded_by]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/storage/objects/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM storage_objects WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve Binary Image Directly from PostgreSQL storage_objects
app.get('/api/storage/:bucket/:fileName', async (req, res) => {
  try {
    const { bucket, fileName } = req.params;
    const { rows } = await pool.query(
      `SELECT mime_type, base64_data FROM storage_objects WHERE bucket_id = $1 AND file_name = $2 LIMIT 1`,
      [bucket, fileName]
    );
    if (rows.length === 0) {
      return res.status(404).send('Image not found in PostgreSQL storage');
    }
    const imgBuffer = Buffer.from(rows[0].base64_data, 'base64');
    res.setHeader('Content-Type', rows[0].mime_type || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(imgBuffer);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 3. PRODUCTS (MATTRESSES) ENDPOINTS
app.get('/api/products', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM products WHERE is_active = TRUE ORDER BY starting_price ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const {
      id,
      slug,
      name,
      tagline = 'Handcrafted Mindfree Comfort',
      categories = ['orthopedic'],
      top_finish_style = 'Euro Top',
      warranty_months = 60,
      starting_price = 12999,
      mrp_price,
      hero_image = '/images/products/product-deluxe.jpg',
      cooling_image = null,
      thickness_options = [6, 8],
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Product name is required' });
    const cleanSlug = (slug || id || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const prodId = id || cleanSlug;
    const computedMrp = mrp_price || Math.round(Number(starting_price) * 1.15);

    const { rows } = await pool.query(
      `INSERT INTO products (
         id, slug, name, tagline, categories, top_finish_style,
         warranty_months, starting_price, mrp_price, hero_image, cooling_image, thickness_options
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         tagline = EXCLUDED.tagline,
         categories = EXCLUDED.categories,
         top_finish_style = EXCLUDED.top_finish_style,
         warranty_months = EXCLUDED.warranty_months,
         starting_price = EXCLUDED.starting_price,
         mrp_price = EXCLUDED.mrp_price,
         hero_image = EXCLUDED.hero_image,
         cooling_image = EXCLUDED.cooling_image,
         updated_at = NOW()
       RETURNING *`,
      [
        prodId,
        cleanSlug,
        name,
        tagline,
        Array.isArray(categories) ? categories : [categories],
        top_finish_style,
        Number(warranty_months),
        Number(starting_price),
        Number(computedMrp),
        hero_image,
        cooling_image,
        Array.isArray(thickness_options) ? thickness_options : [6, 8],
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. PILLOWS & ACCESSORIES ENDPOINTS
app.get('/api/pillows', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM pillows_accessories WHERE is_active = TRUE ORDER BY created_at ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. ORDERS ENDPOINTS
const mapOrderRow = (row) => ({
  orderId: row.order_id,
  createdAt: row.created_at,
  customer: row.customer_info,
  items: row.items,
  subtotal: row.subtotal,
  totalSavings: row.total_savings,
  shipping: row.shipping,
  tax: row.tax,
  total: row.total,
  paymentMethod: row.payment_method,
  paymentStatus: row.payment_status,
  orderStatus: row.order_status,
  trackingNumber: row.tracking_number,
  courierPartner: row.courier_partner,
  estimatedDelivery: row.estimated_delivery,
  statusHistory: Array.isArray(row.status_history)
    ? row.status_history.map((h) => ({
        ...h,
        note: typeof h?.note === 'string' ? h.note.replace(/\s*in PostgreSQL\.?/gi, '.') : h?.note,
      }))
    : [],
});

app.get('/api/orders', async (_req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM orders ORDER BY created_at DESC`);
    res.json(rows.map(mapOrderRow));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const o = req.body;
    const { rows } = await pool.query(
      `INSERT INTO orders (
         order_id, customer_email, customer_phone, customer_info, items,
         subtotal, total_savings, shipping, tax, total,
         payment_method, payment_status, order_status,
         tracking_number, courier_partner, estimated_delivery, status_history, created_at
       )
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17::jsonb, $18)
       ON CONFLICT (order_id) DO UPDATE SET
         order_status = EXCLUDED.order_status,
         tracking_number = EXCLUDED.tracking_number,
         courier_partner = EXCLUDED.courier_partner,
         estimated_delivery = EXCLUDED.estimated_delivery,
         status_history = EXCLUDED.status_history,
         updated_at = NOW()
       RETURNING *`,
      [
        o.orderId,
        o.customer?.email || '',
        o.customer?.phone || '',
        JSON.stringify(o.customer || {}),
        JSON.stringify(o.items || []),
        Number(o.subtotal || 0),
        Number(o.totalSavings || 0),
        Number(o.shipping || 0),
        Number(o.tax || 0),
        Number(o.total || 0),
        o.paymentMethod || 'upi',
        o.paymentStatus || 'Paid',
        o.orderStatus || 'Confirmed',
        o.trackingNumber || `MF-TRK-${Date.now()}`,
        o.courierPartner || 'Mindfree Dedicated White-Glove Fleet',
        o.estimatedDelivery || '',
        JSON.stringify(o.statusHistory || []),
        o.createdAt || new Date().toISOString(),
      ]
    );
    res.status(201).json(mapOrderRow(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const {
      newStatus,
      note,
      updatedBy = 'Atelier Master Craftsman',
      courierPartner,
      courierWaybill,
      trackingNumber,
      estimatedDelivery,
    } = req.body;

    const existing = await pool.query(`SELECT * FROM orders WHERE UPPER(order_id) = UPPER($1)`, [orderId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const row = existing.rows[0];
    const resolvedStatus = newStatus || row.order_status;
    const resolvedTracking =
      (trackingNumber && trackingNumber.trim()) ||
      (courierWaybill && courierWaybill.trim()) ||
      row.tracking_number;
    const resolvedCourier =
      (courierPartner && courierPartner.trim()) || row.courier_partner;
    const resolvedDelivery =
      (estimatedDelivery && estimatedDelivery.trim()) || row.estimated_delivery;

    const defaultNotes = {
      Confirmed: 'Order confirmed and payment verified.',
      'Preparing in Atelier':
        'Atelier craftsmanship in progress: multi-tier pocket coils and botanic foam assembly.',
      Dispatched: 'Loaded onto dedicated white-glove transport vehicle for in-room delivery.',
      Delivered:
        'Mattress successfully installed in bedroom. 100-night comfort trial officially activated.',
    };

    const history = Array.isArray(row.status_history) ? [...row.status_history] : [];
    history.push({
      status: resolvedStatus,
      timestamp: new Date().toISOString(),
      note:
        (note && note.trim()) ||
        defaultNotes[resolvedStatus] ||
        `Order status updated to ${resolvedStatus}.`,
      updatedBy,
      courierPartner: resolvedCourier,
      courierWaybill: resolvedTracking,
    });

    const updated = await pool.query(
      `UPDATE orders
       SET order_status = $1,
           status_history = $2::jsonb,
           courier_partner = $3,
           tracking_number = $4,
           estimated_delivery = $5,
           updated_at = NOW()
       WHERE order_id = $6
       RETURNING *`,
      [
        resolvedStatus,
        JSON.stringify(history),
        resolvedCourier,
        resolvedTracking,
        resolvedDelivery,
        row.order_id,
      ]
    );

    res.json(mapOrderRow(updated.rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. REVIEWS ENDPOINTS
app.get('/api/reviews', async (_req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM reviews ORDER BY created_at DESC`);
    res.json(
      rows.map((r) => ({
        id: r.id,
        name: r.customer_name,
        date: r.review_date,
        rating: r.rating,
        reviewText: r.review_text || undefined,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const { id, name, date, rating = 5, reviewText } = req.body;
    if (!name) return res.status(400).json({ error: 'Customer name is required' });
    const revId = id || `rev-${Date.now()}`;
    const today = new Date();
    const revDate =
      date ||
      `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

    const { rows } = await pool.query(
      `INSERT INTO reviews (id, customer_name, rating, review_text, review_date, is_verified)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING *`,
      [revId, name, Number(rating), reviewText || null, revDate]
    );
    const r = rows[0];
    res.status(201).json({
      id: r.id,
      name: r.customer_name,
      date: r.review_date,
      rating: r.rating,
      reviewText: r.review_text || undefined,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. SITE CONTENT / CMS ENDPOINTS
app.get('/api/content', async (_req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM site_content ORDER BY id ASC`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/content', async (req, res) => {
  try {
    const {
      section_key,
      title,
      subtitle = '',
      badge_text = '',
      cta_text = '',
      cta_link = '',
      image_url = '',
      content_json = {},
    } = req.body;
    if (!section_key || !title) {
      return res.status(400).json({ error: 'section_key and title are required' });
    }
    const { rows } = await pool.query(
      `INSERT INTO site_content (section_key, title, subtitle, badge_text, cta_text, cta_link, image_url, content_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
       ON CONFLICT (section_key) DO UPDATE SET
         title = EXCLUDED.title,
         subtitle = EXCLUDED.subtitle,
         badge_text = EXCLUDED.badge_text,
         cta_text = EXCLUDED.cta_text,
         cta_link = EXCLUDED.cta_link,
         image_url = EXCLUDED.image_url,
         content_json = EXCLUDED.content_json,
         updated_at = NOW()
       RETURNING *`,
      [
        section_key,
        title,
        subtitle,
        badge_text,
        cta_text,
        cta_link,
        image_url,
        JSON.stringify(content_json),
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. NEWSLETTER & CONTACT INQUIRIES ENDPOINTS
app.post('/api/newsletter', async (req, res) => {
  try {
    const { email, source = 'footer' } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const { rows } = await pool.query(
      `INSERT INTO newsletter_subscribers (email, source)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET subscribed_at = NOW()
       RETURNING *`,
      [email.trim().toLowerCase(), source]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/inquiries', async (_req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM contact_inquiries ORDER BY created_at DESC`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/inquiries', async (req, res) => {
  try {
    const { full_name, email, phone = '', subject = 'General Concierge Inquiry', message } = req.body;
    if (!full_name || !email || !message) {
      return res.status(400).json({ error: 'full_name, email, and message are required' });
    }
    const { rows } = await pool.query(
      `INSERT INTO contact_inquiries (full_name, email, phone, subject, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [full_name, email, phone, subject, message]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function ensureCrispProductImages() {
  try {
    const highResMap = [
      ['ortho-firm', '/images/products/product-cool-ortho.jpg'],
      ['ultima-bonnell-spring', '/images/mindfree/mindfree-spring.webp'],
      ['ultima-pocket-spring', '/images/mindfree/mindfree-spring.webp'],
      ['natural-latex-classic', '/images/products/product-cool-latex-plus.jpg'],
      ['royal-sapphire-ortho', '/images/rooms/room-bestseller-ortho.jpg'],
      ['royal-pillow-top-spring', '/images/products/product-dream-comfort.jpg'],
      ['spine-relax-ortho', '/images/products/product-spine-care.jpg'],
    ];
    for (const [id, img] of highResMap) {
      await pool.query(
        `UPDATE products SET hero_image = $1 WHERE id = $2 AND (hero_image LIKE '/images/type_%' OR hero_image LIKE '/images/mat_%' OR hero_image LIKE '/images/design_%' OR hero_image LIKE '/api/storage/admin-campaigns/%')`,
        [img, id]
      );
    }
    await pool.query(
      `UPDATE products SET hero_image = '/images/products/product-deluxe.jpg' WHERE hero_image LIKE '/images/type_%' OR hero_image LIKE '/images/mat_%' OR hero_image LIKE '/images/design_%'`
    );
  } catch (err) {
    console.warn('Could not auto-upgrade product hero images:', err.message);
  }
}

if (!process.env.VERCEL) {
  const distDir = path.resolve(__dirname, '../dist');
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }
  app.listen(PORT, () => {
    console.log(`Mindfree PostgreSQL API Server running on http://localhost:${PORT}`);
    ensureCrispProductImages();
  });
}

export default app;
