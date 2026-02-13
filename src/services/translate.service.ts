import { TRANSLATE_API_KEY, TRANSLATE_API_URL, TRANSLATE_MODEL } from "#/configs/env.config"

import axios from "axios"

class TranslateService {
    /**
     * Translate original text to target language (Default Vietnamese)
     * @param text Original text
     * @param targetLang Target language
     */
    async translate(text: string, targetLang: string = "Vietnamese"): Promise<string> {
        if (!text || text.trim().length === 0) return ""

        // Using API model AI for translate original text to target language
        try {
            const response = await axios.post(
                TRANSLATE_API_URL,
                {
                    model: TRANSLATE_MODEL,
                    messages: [
                        {
                            role: "system",
                            // Script for require AI to translate input text
                            content: `Translate users input to ${targetLang}. Return ONLY the translated text.`,
                        },
                        {
                            role: "user",
                            content: text,
                        },
                    ],
                    // Temperature: 0 - 2. Low: 0 - 0.3. High: 1 - 2
                    // Keep low temperature for more extractly result
                    temperature: 0.1,
                },
                {
                    headers: {
                        // Add API key in header for using the model
                        Authorization: `Bearer ${TRANSLATE_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                },
            )

            const translatedText = response.data.choices[0]?.message?.content || ""
            return translatedText.trim()
        } catch (error) {
            console.error("TranslateService - translate ERROR:", (error as Error).message)
            // Return original text if catching error
            return text
        }
    }
}

export const translateService = new TranslateService()
