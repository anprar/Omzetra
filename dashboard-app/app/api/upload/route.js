import { NextResponse } from 'next/server';
import { run } from '@/lib/db';

function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  if (lines.length === 0) return [];
  
  // Clean headers and convert to lowercase
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
  const results = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^["']|["']$/g, ''));
    
    if (values.length >= headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      results.push(row);
    }
  }
  return results;
}

// Helper to generate safe IDs from names if IDs are missing
function generateSlug(prefix, name) {
  if (!name) return `${prefix}-UNKNOWN`;
  const clean = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `${prefix}-${clean}`;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    
    const text = await file.text();
    const rows = parseCSV(text);
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty or invalid' }, { status: 400 });
    }
    
    // Clear sales transactions but KEEP master data to preserve admin target/price overrides
    await run('DELETE FROM sales');
    
    for (const row of rows) {
      // Find columns (case-insensitive checks)
      const tanggal = row.tanggal || row.date || '';
      
      // Customer details
      const customerName = row.customer || row.pelanggan || row.nama_customer || row.customer_name || '';
      const customerId = row.customer_id || row.id_customer || row.pelanggan_id || generateSlug('CST', customerName);
      
      // Product details
      const productName = row.produk || row.product || row.barang || row.nama_produk || row.product_name || '';
      const productId = row.product_id || row.produk_id || row.id_produk || row.id_barang || row.barang_id || generateSlug('PRD', productName);
      
      // Sales details
      const salesName = row.sales || row.salesperson || row.karyawan || row.nama_sales || row.sales_name || '';
      const salesId = row.sales_id || row.id_sales || row.karyawan_id || row.salesperson_id || generateSlug('SLS', salesName);
      
      const qty = parseInt(row.qty || row.quantity || row.jumlah || '0', 10);
      const harga = parseFloat(row.harga || row.price || row.harga_satuan || '0');
      
      // Compute total omzet if not directly provided
      let omzet = parseFloat(row.omzet || row.revenue || row.total || '0');
      if (omzet === 0 && qty > 0 && harga > 0) {
        omzet = qty * harga;
      }
      
      const target = parseFloat(row.target || row.target_penjualan || '0');
      
      if (tanggal && customerName && productName && salesName) {
        // Auto-create Master Data (Insert or Ignore to avoid overwriting existing custom admin edits)
        await run(
          `INSERT OR IGNORE INTO customers (id, name) VALUES (?, ?)`,
          [customerId, customerName]
        );
        
        await run(
          `INSERT OR IGNORE INTO products (id, name, price) VALUES (?, ?, ?)`,
          [productId, productName, harga]
        );
        
        await run(
          `INSERT OR IGNORE INTO salespeople (id, name, target) VALUES (?, ?, ?)`,
          [salesId, salesName, target]
        );
        
        // Insert transaction record referencing the Master Data IDs
        await run(
          `INSERT INTO sales (tanggal, customer_id, product_id, sales_id, qty, harga, omzet)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [tanggal, customerId, productId, salesId, qty, harga, omzet]
        );
      }
    }
    
    return NextResponse.json({ success: true, count: rows.length });
  } catch (error) {
    console.error('Error handling upload:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
