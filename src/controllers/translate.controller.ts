import { HttpStatusCode } from "#/configs/response.config"
import { TranslateService } from "#/services/translate.service"

import { Socket } from "socket.io"

class TranslateController {
    translateContent = (socket: Socket) => {
        let service: TranslateService | null = null

        try {
            service = new TranslateService()
        } catch (err) {
            socket.emit("stt_error", { message: "Failed to start STT service" })
            return
        }
        socket.on("voice_stream", (audioBuffer: Buffer) => {
            try {
                // Processing audio
                const { transcript, isEndpoint } = service.processAudio(audioBuffer)

                if (transcript) {
                    socket.emit("stt_partial", { text: transcript })
                    console.log(transcript)
                }

                if (isEndpoint) {
                    const finalTranscript = service.flush()
                    if (finalTranscript) {
                        socket.emit("stt_final", { text: finalTranscript })
                    }
                }
            } catch (error) {
                console.error(
                    "TranslateController - translateContent ERROR: " + (error as Error).message,
                )
                socket.emit("stt_error", {
                    status: HttpStatusCode.INTERNAL_SERVER,
                    message: "Internal server error",
                })
            }
        })

        socket.on("disconnect", () => {
            // Cleanup service
            if (service) {
                service.release()
                service = null
            }
        })
    }
}

export const translateController = new TranslateController()
