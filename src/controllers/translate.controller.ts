import { HttpStatusCode } from "#/configs/response.config"
import { SttService } from "#/services/stt.service"
import { translateService } from "#/services/translate.service"

import { WebSocket } from "ws"

class TranslateController {
    /**
     * Convert audio to text & translate in realtime
     * @param ws WebSocket connection to translate data realtime with client
     * @returns
     * - Response translated text after processing & translate audio
     * - Data response realtime with data input
     */
    translate = (ws: WebSocket) => {
        let service: SttService | null = null

        try {
            service = new SttService()
        } catch (err) {
            this.send(ws, "stt_error", { message: "Failed to start STT service" })
            return
        }

        ws.on("message", async (data: Buffer, isBinary: boolean) => {
            // Only accept binary data (audio chunks)
            if (!isBinary) {
                console.log("⚠️ Skipping non-binary data")
                return
            }

            try {
                // Echo test - Send confirmation when receive chunk
                this.send(ws, "chunk_received", { bytes: data.length })
                console.log("Received chunk of size:", data.length)

                // Processing audio to text
                const { originalText, isEndpoint } = service!.processAudio(data)

                // Translate text
                const translatedText = await translateService.translate(originalText)

                // Send translated text to client
                if (originalText) {
                    console.log(`Partial Translated: "${translatedText}"`)
                    this.send(ws, "stt_partial", { text: translatedText })
                }

                // Handle at the end of sentence
                if (isEndpoint) {
                    // Get flush text in buffer
                    const flushOriginalText = service!.flush()

                    // Translate flush text
                    const flushTranslatedContent =
                        await translateService.translate(flushOriginalText)

                    // Send flush translated text to client
                    if (flushTranslatedContent) {
                        console.log(`Flush translated: "${flushTranslatedContent}"`)
                        this.send(ws, "stt_flush", { text: flushTranslatedContent })
                    }
                }
            } catch (error) {
                console.error(
                    "TranslateController - translateContent ERROR: " + (error as Error).message,
                )
                this.send(ws, "stt_error", {
                    status: HttpStatusCode.INTERNAL_SERVER,
                    message: "Internal server error",
                })
            }
        })

        ws.on("close", () => {
            // Cleanup service
            if (service) {
                service.release()
                service = null
            }
        })
    }

    /**
     * Helper function to send JSON message via WebSocket
     */
    private send = (ws: WebSocket, type: string, payload: object) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type, payload }))
        }
    }
}

export const translateController = new TranslateController()
