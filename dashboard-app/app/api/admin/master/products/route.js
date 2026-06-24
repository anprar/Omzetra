import { NextResponse } from 'next/server';
import { query, run } from '@/lib/db';

export async function GET() {
  try {
    const list = await query(`SELECT id, name, price FROM products ORDER BY name ASC`);
    return NextResponse.json({ success: true, list });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { id, name, price } = await request.json();
    
    if (!id || !name) {
      return NextResponse.json({ error: 'ID and Name are required' }, { status: 400 });
    }
    
    const priceVal = parseFloat(price || '0');
    await run(
      `UPDATE products SET name = ?, price = ? WHERE id = ?`,
      [name.trim(), priceVal, id]
    );
    
    return NextResponse.json({ success: true, message: 'Product updated successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
