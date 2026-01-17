import { HttpStatusCode } from "#/configs/response.config"
import translateRoutes from "#/routes/translate.route"

import express, { Request, Response } from "express"

const app = express()

// Middleware
app.use(express.json())

// Routes
app.get("/", (req: Request, res: Response) => {
    res.status(HttpStatusCode.OK).json({ message: "Connect to server successfully" })
})

// Correct way to mount routes
app.use("/api/translate", translateRoutes)

// 404 Handler
app.use((req: Request, res: Response) => {
    res.status(HttpStatusCode.NOT_FOUND).json({
        status: "error",
        message: "Route not found",
    })
})

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: any) => {
    console.error("GLOBAL ERROR:", err)
    res.status(500).send("Internal Server Error")
})

export default app
