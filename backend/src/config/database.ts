import { PrismaClient } from "@prisma/client";

//prevent multiple instances in development
declare global {
    var prisma: PrismaClient | undefined
}

const prisma = global.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error']
})

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma
}

export default prisma

//helper function to handle database connection
export async function connectDatabase(): Promise<void> {
    try {
        await prisma.$connect()
        console.log('Database connected successfully')
    } catch (err) {
        console.error('Database connection failed')
        process.exit(1)
    }
}

//graceful shutdown

export async function disconnectDatabase(): Promise<void> {
    await prisma.$disconnect()
    console.log('Database disconnected')
}

// Handle process termination
process.on('beforeExit', async () => {
    await disconnectDatabase()
})