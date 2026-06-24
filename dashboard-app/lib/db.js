import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'sales.db');

// Enable verbose mode for debugging
const sqlite = sqlite3.verbose();

const db = new sqlite.Database(dbPath, (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    console.log('Connected to database');
    db.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT
      );
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT,
        price REAL
      );
      CREATE TABLE IF NOT EXISTS salespeople (
        id TEXT PRIMARY KEY,
        name TEXT,
        target REAL
      );
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tanggal TEXT,
        customer_id TEXT,
        product_id TEXT,
        sales_id TEXT,
        qty INTEGER,
        harga REAL,
        omzet REAL
      );
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT
      );
      INSERT OR IGNORE INTO users (username, password, role)
      VALUES 
        ('admin', 'adminomzetra', 'admin'),
        ('user', '12345', 'user');
    `, (err) => {
      if (err) {
        console.error('Error initializing database schema:', err);
      } else {
        console.log('Database schema initialized successfully');
      }
    });
  }
});

export function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

export function exec(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
