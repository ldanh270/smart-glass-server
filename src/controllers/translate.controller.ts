import { translateService } from "#/services/translate.service"

import { Request, Response } from "express"

class TranslateController {
    translateContent = async (req: Request, res: Response) => {
        let { content } = req.body

        if (!content) content = ""

        await translateService.translateContent(content)
    }
}

export const translateController = new TranslateController()
