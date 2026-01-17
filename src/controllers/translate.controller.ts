import { translateService } from "#/services/translate.service"

import { Request, Response } from "express"

class TranslateController {
    translateContent = async (req: Request, res: Response) => {
        const file = req.file
    }
}

export const translateController = new TranslateController()
