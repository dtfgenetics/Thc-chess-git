import pg from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim();

// `pg` natively supports the traditional PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE
// environment variables. Managed hosts such as Hostinger + Supabase commonly provide
// one PostgreSQL connection string instead, so accept either production contract.
export const db = new pg.Pool(databaseUrl ? { connectionString: databaseUrl } : undefined);

export const INIT_TABLES = /* sql */ `
    CREATE TABLE IF NOT EXISTS "user" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(128) UNIQUE NOT NULL,
        email VARCHAR(128),
        password TEXT,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        draws INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS "game" (
        id SERIAL PRIMARY KEY,
        winner VARCHAR(5),
        end_reason VARCHAR(16),
        pgn TEXT,
        white_id INT REFERENCES "user",
        white_name VARCHAR(32),
        black_id INT REFERENCES "user",
        black_name VARCHAR(32),
        started_at TIMESTAMP NOT NULL,
        ended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`;
