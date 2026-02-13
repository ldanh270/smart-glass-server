import { PORT } from "#/configs/env.config"
import { HttpStatusCode } from "#/configs/response.config"
import { translateController } from "#/controllers/translate.controller"

import dotenv from "dotenv"
import express, { Request, Response } from "express"
import http from "http"
import { WebSocket, WebSocketServer } from "ws"

dotenv.config()

/**
 * Initial configs
 */
const app = express()
const httpServer = http.createServer(app)

/**
 * Middleware & Routes
 */
app.use(express.json())

app.get("/", (req: Request, res: Response) => {
    res.status(HttpStatusCode.OK).json({ message: "Connect to server successfully" })
})

/**
 * WebSocket server
 */
const wss = new WebSocketServer({ server: httpServer, path: "/ws" })

wss.on("connection", (ws) => {
    console.log("WS connected")

    // WS controllers
    translateController.translate(ws)

    ws.on("close", () => {
        console.log("WS disconnected")
    })

    ws.on("error", (err) => {
        console.error("WS error:", err)
    })
})

/**
 * Start Server
 */
httpServer.listen(PORT, () => {
    console.log(`Server running on PORT: ${PORT}`)
    console.log(`WS endpoint: ws://localhost:${PORT}/ws`)
})
