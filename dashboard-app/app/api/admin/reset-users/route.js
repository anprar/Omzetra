import { NextResponse } from 'next/server';
import { run } from '@/lib/db';

export async function POST(request) {
  try {
    // Clear all users
    await run('DELETE FROM users');
    
    // Re-seed default users
    await run(`
      INSERT INTO users (username, password, role)
      VALUES 
        ('admin', 'adminomzetra', 'admin'),
        ('user', '12345', 'user')
    `);
    
    return NextResponse.json({ success: true, message: 'Daftar pengguna berhasil direset ke default' });
  } catch (error) {
    console.error('Reset users error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
