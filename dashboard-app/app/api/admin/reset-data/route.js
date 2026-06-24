import { NextResponse } from 'next/server';
import { run } from '@/lib/db';

export async function POST(request) {
  try {
    await run('DELETE FROM sales');
    return NextResponse.json({ success: true, message: 'Semua data penjualan berhasil direset' });
  } catch (error) {
    console.error('Reset data error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
