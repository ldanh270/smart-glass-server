import { CLIENT_URL, PORT } from "#/configs/env.config"
import { HttpStatusCode } from "#/configs/response.config"
import { translateController } from "#/controllers/translate.controller"

import dotenv from "dotenv"
import express, { Request, Response } from "express"
import http from "http"
import { Server } from "socket.io"

dotenv.config()

/**
 * Initial configs
 */
// Create expres app
const app = express()

// Create HTTP server from express app
const httpServer = http.createServer(app)

// Create socket
const io = new Server(httpServer, {
    cors: {
        origin: CLIENT_URL,
        credentials: true,
    },
})

/**
 * Middleware & Routes & Sockets
 */

// Middleware
app.use(express.json())

// Routes
app.get("/", (req: Request, res: Response) => {
    res.status(HttpStatusCode.OK).json({ message: "Connect to server successfully" })
})

// ROUTES HERE

io.on("connection", (socket) => {
    console.log("Socket connected: ", socket.id)

    // Sockets
    translateController.translateContent(socket)

    // SOCKET HERE

    socket.on("disconnect", () => {
        console.log("Socket disconnected: ", socket.id)
    })
})

// Start Server
httpServer.listen(PORT, () => {
    console.log(`Server running on PORT: ${PORT}`)
})
