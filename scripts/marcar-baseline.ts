// Marca 0000_baseline como aplicada en drizzle.__drizzle_migrations (la base ya tiene ese esquema).
// Mismo cálculo que drizzle-orm/migrator: hash = sha256(contenido del .sql), created_at = "when" del journal.
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import postgres from 'postgres'

const entry = JSON.parse(readFileSync('drizzle/meta/_journal.json', 'utf8')).entries.find(
  (e: { tag: string }) => e.tag === '0000_baseline',
)
const hash = createHash('sha256').update(readFileSync('drizzle/0000_baseline.sql').toString()).digest('hex')
const sql = postgres(process.env.DATABASE_URL!, { prepare: false })

async function main() {
  await sql`CREATE SCHEMA IF NOT EXISTS drizzle`
  await sql`CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint)`
  const [row] = await sql`select 1 from drizzle.__drizzle_migrations where hash = ${hash}`
  if (row) return console.log('baseline ya marcada')
  await sql`insert into drizzle.__drizzle_migrations (hash, created_at) values (${hash}, ${entry.when})`
  console.log('baseline marcada')
}

main().then(() => sql.end(), (e) => { console.error(e); return sql.end().then(() => process.exit(1)) })
