import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const { Client } = pg
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '..')

const connectionString = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

async function run() {
    console.log('Connecting to DB...')
    const client = new Client({ connectionString })
    await client.connect()

    const files = [
        'migrations/32_admin_rpc.sql',
        'migrations/33_admin_security.sql'
    ]

    try {
        for (const file of files) {
            console.log(`Running ${file}...`)
            const sql = fs.readFileSync(path.join(projectRoot, file), 'utf8')
            await client.query(sql)
            console.log(`Success: ${file}`)
        }
    } catch (err) {
        console.error('Migration failed:', err)
    } finally {
        await client.end()
    }
}

run()
