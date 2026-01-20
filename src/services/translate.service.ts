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

        try {
            const response = await axios.post(
                TRANSLATE_API_URL,
                {
                    model: TRANSLATE_MODEL,
                    messages: [
                        {
                            role: "system",
                            content: `Translate users input to ${targetLang}. Return ONLY the translated text.`,
                        },
                        {
                            role: "user",
                            content: text,
                        },
                    ],
                    temperature: 0.1, // Keep low temperature for more extractly result (0 < temperature < 2)
                },
                {
                    headers: {
                        Authorization: `Bearer ${TRANSLATE_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                },
            )

            const translatedText = response.data.choices[0]?.message?.content || ""
            return translatedText.trim()
        } catch (error) {
            console.error("TranslateService - translate ERROR:", (error as Error).message)
            return text
        }
    }
}

export const translateService = new TranslateService()
