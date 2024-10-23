const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require("path");

const dbPath = path.join(__dirname, "financialRecords.db");

const initializeDB = async () => {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT CHECK(type IN ('income', 'expense')),
      category TEXT,
      amount REAL,
      date TEXT,
      description TEXT
    );
    
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      type TEXT CHECK(type IN ('income', 'expense'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    );

  `);

  return db;
};

module.exports = initializeDB;
