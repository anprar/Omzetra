import { NextResponse } from 'next/server';
import { run } from '@/lib/db';

export async function POST(request) {
  try {
    const { username, password, role } = await request.json();
    
    if (!username || !password || !role) {
      return NextResponse.json({ error: 'Username, Password, dan Role wajib diisi' }, { status: 400 });
    }
    
    await run(
      `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
      [username.trim(), password.trim(), role.trim()]
    );
    
    return NextResponse.json({ success: true, message: 'User berhasil ditambahkan' });
  } catch (error) {
    console.error('Add user error:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
