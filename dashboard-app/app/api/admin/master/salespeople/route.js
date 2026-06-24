import { NextResponse } from 'next/server';
import { query, run } from '@/lib/db';

export async function GET() {
  try {
    const list = await query(`SELECT id, name, target FROM salespeople ORDER BY name ASC`);
    return NextResponse.json({ success: true, list });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { id, name, target } = await request.json();
    
    if (!id || !name) {
      return NextResponse.json({ error: 'ID and Name are required' }, { status: 400 });
    }
    
    const targetVal = parseFloat(target || '0');
    await run(
      `UPDATE salespeople SET name = ?, target = ? WHERE id = ?`,
      [name.trim(), targetVal, id]
    );
    
    return NextResponse.json({ success: true, message: 'Salesperson updated successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
