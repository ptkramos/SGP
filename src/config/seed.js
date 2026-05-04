const bcrypt = require('bcrypt');
const { getDatabase, initializeDatabase } = require('./database');
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

async function seed() {
    initializeDatabase();
    const db = getDatabase();

    // Verificar se já existe admin
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
    if (existing) {
        console.log('⚠️  Usuário admin já existe. Pulando seed.');
        return;
    }

    // Criar usuário admin padrão
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    db.prepare(`
        INSERT INTO users (username, password_hash, full_name, role, sector) 
        VALUES (?, ?, ?, ?, ?)
    `).run('admin', passwordHash, 'Administrador SGP', 'admin', 'TI');

    // Criar usuário de exemplo (patrick.ramos)
    const passwordHash2 = await bcrypt.hash('12345678900', 10);
    
    db.prepare(`
        INSERT INTO users (username, password_hash, full_name, role, sector) 
        VALUES (?, ?, ?, ?, ?)
    `).run('patrick.ramos', passwordHash2, 'Patrick Ramos', 'admin', 'TI');

    console.log('✅ Seed executado com sucesso!');
    console.log('👤 Admin: admin / admin123');
    console.log('👤 Patrick: patrick.ramos / 12345678900');
}

seed().catch(console.error);
