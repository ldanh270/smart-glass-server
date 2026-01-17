import { PORT } from "#/configs/env.config"
import { initSocket } from "#/socket/ws"

import dotenv from "dotenv"
import http from "http"

import app from "./app"

dotenv.config()

// Create HTTP server from express app
const httpServer = http.createServer(app)

// Wrap http server by socket.io
initSocket(httpServer)

// Start Server
httpServer.listen(PORT, () => {
    console.log(`Server started on PORT ${PORT}`)
})
