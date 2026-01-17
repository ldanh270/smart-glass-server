import { CLIENT_URL } from "#/configs/env.config"

import { Server as HttpServer } from "http"
import { Server } from "socket.io"

let io: Server | undefined

export const initSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: CLIENT_URL,
            credentials: true,
        },
    })

    io.on("connection", (socket) => {
        console.log("Socket connected: ", socket.id)

        // Setup các handlers ở đây
        // socket.on("message", chatHandler)

        socket.on("disconnect", () => {
            console.log("Socket disconnected: ", socket.id)
        })
    })

    return io
}

// To use IO in other controller/router, ... (Optional)
export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!")
    }
    return io
}
