import express, {Application, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'dotenv'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

const app: Application = express()

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
    console.log(`Server running on: http://localhost:${PORT}`)
})