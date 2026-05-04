const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', '..', 'data');
const dbPath = process.env.DB_PATH || path.join(dbDir, 'sgp.db');

let db;

function getDatabase() {
    if (!db) {
        // Garantir que o diretório existe
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
        db = new Database(dbPath);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
    }
    return db;
}

function initializeDatabase() {
    const db = getDatabase();

    // Tabela de usuários
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            sector TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Tabela de listas de presença
    db.exec(`
        CREATE TABLE IF NOT EXISTS lists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('reuniao', 'treinamento')),
            event_date DATE NOT NULL,
            scheduled_now BOOLEAN DEFAULT 0,
            status TEXT DEFAULT 'active',
            created_by INTEGER NOT NULL,
            pdf_data BLOB,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL,
            FOREIGN KEY (created_by) REFERENCES users(id)
        )
    `);

    // Tabela de presenças
    db.exec(`
        CREATE TABLE IF NOT EXISTS presences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            list_id INTEGER NOT NULL,
            participant_name TEXT NOT NULL,
            participant_role TEXT NOT NULL,
            participant_sector TEXT,
            participant_cpf TEXT,
            confirmed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
        )
    `);

    // Tabela de participantes (auto-cadastro via confirmação)
    db.exec(`
        CREATE TABLE IF NOT EXISTS participants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cpf TEXT UNIQUE NOT NULL,
            full_name TEXT NOT NULL,
            role_title TEXT,
            sector TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Índices
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_lists_code ON lists(code);
        CREATE INDEX IF NOT EXISTS idx_lists_created_by ON lists(created_by);
        CREATE INDEX IF NOT EXISTS idx_lists_event_date ON lists(event_date);
        CREATE INDEX IF NOT EXISTS idx_presences_list_id ON presences(list_id);
        CREATE INDEX IF NOT EXISTS idx_participants_cpf ON participants(cpf);
    `);

    // Migrações (colunas adicionais para bancos existentes)
    try {
        db.exec(`ALTER TABLE presences ADD COLUMN participant_cpf TEXT`);
    } catch (e) {}

    try {
        db.exec(`ALTER TABLE lists ADD COLUMN status TEXT DEFAULT 'active'`);
    } catch (e) {}

    console.log('✅ Banco de dados inicializado com sucesso');
}

module.exports = { getDatabase, initializeDatabase };
