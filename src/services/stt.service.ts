import { STT_API_KEY } from "#/configs/env.config"

import { Cheetah } from "@picovoice/cheetah-node"

export class SttService {
    private cheetah: Cheetah | null = null
    private frameAccumulator: number[] = []

    /**
     * Set up 3rd STT service for processing
     */
    constructor() {
        try {
            this.cheetah = new Cheetah(STT_API_KEY)
        } catch (error) {
            console.error("TranslateService - translateContent ERROR: " + (error as Error).message)
            throw new Error("Failed to initialize STT Engine")
        }
    }

    /**
     *
     * @param audioBuffer Binary audio (8-bit) for convert to text
     * @returns
     * - transcript: Newest text translated by the newest sound chunk (Not sentence)
     * - isEndpoint: Check if user stopped speaking or finished sentence
     *      + true: User stopped speaking/finished sentence
     *      + false: The user still speaking or hasn't finished sentence
     */
    processAudio = (audioBuffer: Buffer) => {
        if (!this.cheetah) throw new Error("STT Service destroyed")

        // Convert buffer NodeJS (8-bit) to PCM format (16-bit)
        const audioFrame = new Int16Array(
            audioBuffer.buffer,
            audioBuffer.byteOffset,
            audioBuffer.byteLength / 2,
        )

        this.frameAccumulator.push(...audioFrame)

        let originalText = ""
        let isEndpoint = false
        const frameLength = this.cheetah.frameLength // Default is 512 samples

        // Loop to check enough frame length to process
        while (this.frameAccumulator.length >= frameLength) {
            // Get extract frame length to process
            const frameToProcess = new Int16Array(this.frameAccumulator.slice(0, frameLength))

            // Remove processed frame from accumulator
            this.frameAccumulator = this.frameAccumulator.slice(frameLength)

            // Process using Cheetah (Extract frameLength samples)
            const result = this.cheetah.process(frameToProcess)

            // Accumulate the results
            originalText += result[0]
            if (result[1]) isEndpoint = true
        }

        return { originalText, isEndpoint }
    }

    /**
     * Retrieve remaining text from buffer
     * - Use at the end of sentence
     * - To retrieve the last text from buffer
     */
    flush = () => {
        if (!this.cheetah) return ""
        this.frameAccumulator = []
        return this.cheetah.flush()
    }

    /**
     * Release resources
     * - Cleanup function
     * - To avoid stackoverflow & out of memory
     */
    release = () => {
        if (this.cheetah) {
            this.cheetah.release()
            this.cheetah = null
            this.frameAccumulator = []
        }
    }
}
