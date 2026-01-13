import dotenv from "dotenv"
import express, { NextFunction, Request, Response } from "express"

/**
 * Server configurations
 */
dotenv.config() // Create config for using .env variables
const PORT = process.env.PORT || 5000 // Port where server runing on
const app = express()

/**
 * Middleware
 */

app.use(express.json())

/**
 * Main routers
 */

// Public routes
app.get("/", async (req: Request, res: Response) =>
    res.status(200).json({ message: "Connect to server successfully" }),
)

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        status: "error",
        message: "Route not found",
    })
})

// Global error
app.use((err: any, req: Request, res: Response) => {
    console.error("GLOBAL ERROR:", err)
    res.status(500).send("Internal Server Error")
})

/**
 * Server listening on PORT
 */
app.listen(PORT, () => {
    console.log("Server start on port " + PORT)
})
