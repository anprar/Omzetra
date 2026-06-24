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
    
    // We will clear existing data and insert new data for the prototype
    // (This is common for re-uploading spreadsheets, but we can also append.
    // For a dashboard upload approach, clearing and reloading is the standard way to replace the report data)
    await run('DELETE FROM sales');
    
    for (const row of rows) {
      // Find columns (case-insensitive checks)
      const tanggal = row.tanggal || row.date || '';
      const customer = row.customer || row.pelanggan || '';
      const produk = row.produk || row.product || row.barang || '';
      const sales = row.sales || row.salesperson || row.karyawan || '';
      
      const qty = parseInt(row.qty || row.quantity || row.jumlah || '0', 10);
      const harga = parseFloat(row.harga || row.price || row.harga_satuan || '0');
      
      // If omzet is directly provided, use it. Otherwise compute qty * harga
      let omzet = parseFloat(row.omzet || row.revenue || row.total || '0');
      if (omzet === 0 && qty > 0 && harga > 0) {
        omzet = qty * harga;
      }
      
      const target = parseFloat(row.target || row.target_penjualan || '0');
      
      if (tanggal) {
        await run(
          `INSERT INTO sales (tanggal, customer, produk, sales, qty, harga, omzet, target)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [tanggal, customer, produk, sales, qty, harga, omzet, target]
        );
      }
    }
    
    return NextResponse.json({ success: true, count: rows.length });
  } catch (error) {
    console.error('Error handling upload:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
