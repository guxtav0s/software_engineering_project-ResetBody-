
const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(
    path.join(__dirname, "atividades.db")
);

db.exec(`
    CREATE TABLE IF NOT EXISTS atividades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        descricao TEXT NOT NULL,
        imagem TEXT,

        tipo TEXT NOT NULL CHECK (
            tipo IN ('tempo', 'repeticao', 'hidratacao')
        ),

        duracao INTEGER,
        repeticoes INTEGER,

        CHECK (
            (tipo = 'tempo'
                AND duracao IS NOT NULL
                AND duracao > 0
                AND repeticoes IS NULL)

            OR

            (tipo = 'repeticao'
                AND repeticoes IS NOT NULL
                AND repeticoes > 0
                AND duracao IS NULL)

            OR

            (tipo = 'hidratacao'
                AND duracao IS NULL
                AND repeticoes IS NULL)
        )
    );
`);

module.exports = db;