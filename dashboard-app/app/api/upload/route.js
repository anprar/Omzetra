import { NextResponse } from 'next/server';
import { run } from '@/lib/db';
import * as XLSX from 'xlsx';

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
    const files = formData.getAll('files');
    const singleFile = formData.get('file');
    const sheetUrl = formData.get('sheetUrl');
    
    let rows = [];
    
    if (sheetUrl) {
      // Import from Google Sheets
      const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) {
        return NextResponse.json({ error: 'Format link Google Sheets tidak valid. Harus mengandung ID spreadsheet.' }, { status: 400 });
      }
      const csvUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
      const res = await fetch(csvUrl);
      if (!res.ok) {
        return NextResponse.json({ error: 'Gagal mengunduh Google Sheets. Pastikan link disetel ke "Siapa saja yang memiliki link dapat melihat" (Viewer/Publik).' }, { status: 400 });
      }
      const text = await res.text();
      rows = parseCSV(text);
    } else {
      // Gather files to process
      const filesToProcess = files && files.length > 0 ? files : (singleFile ? [singleFile] : []);
      
      if (filesToProcess.length === 0) {
        return NextResponse.json({ error: 'File atau link Google Sheets wajib disertakan' }, { status: 400 });
      }
      
      for (const file of filesToProcess) {
        const fileName = file.name.toLowerCase();
        let fileRows = [];
        
        if (fileName.endsWith('.csv')) {
          const text = await file.text();
          fileRows = parseCSV(text);
        } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
          const buffer = await file.arrayBuffer();
          const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          
          // Normalize headers to lowercase
          fileRows = rawRows.map(row => {
            const normalized = {};
            Object.keys(row).forEach(key => {
              normalized[key.trim().toLowerCase()] = row[key].toString().trim();
            });
            return normalized;
          });
        } else {
          return NextResponse.json({ error: `Format file ${file.name} tidak didukung. Gunakan .csv, .xlsx, atau .xls` }, { status: 400 });
        }
        
        rows = rows.concat(fileRows);
      }
    }
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Data kosong atau format tidak sesuai' }, { status: 400 });
    }
    
    // We do NOT delete existing sales here to allow accumulating monthly reports.
    // The admin has a dedicated "Reset Data Penjualan" button in the Admin Panel if they want a clean database.
    const { query } = require('@/lib/db');

    let totalRows = rows.length;
    let validRows = 0;
    let emptyCells = 0;
    let duplicateCount = 0;
    let invalidDates = 0;
    let missingColumns = 0;
    
    // Check headers presence on the first row
    const firstRowKeys = Object.keys(rows[0]);
    const hasTanggal = firstRowKeys.some(k => ['tanggal', 'date'].includes(k));
    const hasCustomer = firstRowKeys.some(k => ['customer', 'pelanggan', 'nama_customer', 'customer_name'].includes(k));
    const hasProduct = firstRowKeys.some(k => ['produk', 'product', 'barang', 'nama_produk', 'product_name'].includes(k));
    const hasSales = firstRowKeys.some(k => ['sales', 'salesperson', 'karyawan', 'nama_sales', 'sales_name'].includes(k));
    const hasQty = firstRowKeys.some(k => ['qty', 'quantity', 'jumlah'].includes(k));
    const hasHarga = firstRowKeys.some(k => ['harga', 'price', 'harga_satuan'].includes(k));

    for (const row of rows) {
      // Find columns (case-insensitive checks)
      const tanggal = row.tanggal || row.date || '';
      
      // Customer details
      const customerName = row.customer || row.pelanggan || row.nama_customer || row.customer_name || '';
      const customerId = row.customer_id || row.id_customer || row.pelanggan_id || (customerName ? generateSlug('CST', customerName) : '');
      
      // Product details
      const productName = row.produk || row.product || row.barang || row.nama_produk || row.product_name || '';
      const productId = row.product_id || row.produk_id || row.id_produk || row.id_barang || row.barang_id || (productName ? generateSlug('PRD', productName) : '');
      
      // Sales details
      const salesName = row.sales || row.salesperson || row.karyawan || row.nama_sales || row.sales_name || '';
      const salesId = row.sales_id || row.id_sales || row.karyawan_id || row.salesperson_id || (salesName ? generateSlug('SLS', salesName) : '');
      
      const qtyStr = row.qty || row.quantity || row.jumlah || '';
      const hargaStr = row.harga || row.price || row.harga_satuan || '';
      
      const qty = parseInt(qtyStr || '0', 10);
      const harga = parseFloat(hargaStr || '0');
      
      // Compute total omzet if not directly provided
      let omzet = parseFloat(row.omzet || row.revenue || row.total || '0');
      if (omzet === 0 && qty > 0 && harga > 0) {
        omzet = qty * harga;
      }
      
      const target = parseFloat(row.target || row.target_penjualan || '0');
      
      // Validate mandatory fields
      if (!tanggal || !customerName || !productName || !salesName || !qtyStr || !hargaStr) {
        emptyCells++;
        continue;
      }

      // Validate Date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(tanggal)) {
        invalidDates++;
        continue;
      }
      
      // Auto-create Master Data (Insert or Ignore to protect custom settings)
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
      
      // Prevent duplicate transaction entries: check if exactly the same record already exists
      const existingTx = await query(
        `SELECT id FROM sales 
         WHERE tanggal = ? AND customer_id = ? AND product_id = ? AND sales_id = ? AND qty = ? AND harga = ?`,
        [tanggal, customerId, productId, salesId, qty, harga]
      );
      
      if (existingTx.length === 0) {
        // Insert transaction record referencing the Master Data IDs
        await run(
          `INSERT INTO sales (tanggal, customer_id, product_id, sales_id, qty, harga, omzet)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [tanggal, customerId, productId, salesId, qty, harga, omzet]
        );
        validRows++;
      } else {
        duplicateCount++;
      }
    }

    // Save validation log to database for persistence
    const validationLog = {
      timestamp: new Date().toISOString(),
      totalRows,
      validRows,
      emptyCells,
      duplicateCount,
      invalidDates,
      headersStatus: {
        tanggal: hasTanggal,
        customer: hasCustomer,
        produk: hasProduct,
        sales: hasSales,
        qty: hasQty,
        harga: hasHarga
      }
    };

    await run(
      `INSERT OR REPLACE INTO system_metadata (key, value) VALUES (?, ?)`,
      ['last_upload_validation', JSON.stringify(validationLog)]
    );
    
    return NextResponse.json({ 
      success: true, 
      count: validRows,
      validation: validationLog
    });
  } catch (error) {
    console.error('Error handling upload:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
