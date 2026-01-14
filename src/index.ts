import { PORT } from "#/configs/environments.configs"
import { HttpStatusCode } from "#/configs/response.configs"
import translateRoutes from "#/routes/translate.routes"

import dotenv from "dotenv"
import express, { NextFunction, Request, Response } from "express"

/**
 * Server configurations
 */
dotenv.config() // Create config for using .env variables
const app = express()

/**
 * Middleware
 */

app.use(express.json())

/**
 * Main routers
 */

app.get("/", async (req: Request, res: Response) =>
    res.status(HttpStatusCode.OK).json({ message: "Connect to server successfully" }),
)

app.use("/api/translate", translateRoutes)

// Not-found handler
app.use((req: Request, res: Response) => {
    res.status(HttpStatusCode.NOT_FOUND).json({
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
