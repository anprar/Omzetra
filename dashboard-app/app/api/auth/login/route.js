import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan Password wajib diisi' }, { status: 400 });
    }
    
    const users = await query(
      `SELECT username, role FROM users WHERE username = ? AND password = ?`,
      [username.trim(), password.trim()]
    );
    
    if (users.length === 0) {
      return NextResponse.json({ error: 'Username atau Password salah' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      success: true, 
      user: {
        username: users[0].username,
        role: users[0].role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
