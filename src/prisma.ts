import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { PrismaClient } from "../generated/prisma/client.ts"

const adapter = new PrismaBetterSqlite3({ url: "file:./data/app.db" })
const prisma = new PrismaClient({ adapter })

export default prisma
