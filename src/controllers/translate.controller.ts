import { HttpStatusCode } from "#/configs/response.config"
import { SttService } from "#/services/stt.service"
import { translateService } from "#/services/translate.service"

import { Socket } from "socket.io"

class TranslateController {
    /**
     * Convert audio to text & translate in realtime
     * @param socket Socket to translate data realtime with client
     * @returns
     * - Response translated text after processing & translate audio
     * - Data response realtime with data input
     */
    translate = (socket: Socket) => {
        let service: SttService | null = null

        try {
            service = new SttService()
        } catch (err) {
            socket.emit("stt_error", { message: "Failed to start STT service" })
            return
        }
        socket.on("voice_stream", async (audioBuffer: Buffer) => {
            try {
                // Processing audio to text
                const { originalText, isEndpoint } = service.processAudio(audioBuffer)

                // Translate text
                const translatedText = await translateService.translate(originalText)

                // Send translated text to client
                if (originalText) socket.emit("stt_partial", { text: translatedText })

                // Handle at the end of sentence
                if (isEndpoint) {
                    // Get flush text in buffer
                    const flushOriginalText = service.flush()

                    // Translate flush text
                    const flushTranslatedContent =
                        await translateService.translate(flushOriginalText)

                    // Send flush translated text to client
                    if (flushTranslatedContent)
                        socket.emit("stt_flush", { text: flushTranslatedContent })
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
