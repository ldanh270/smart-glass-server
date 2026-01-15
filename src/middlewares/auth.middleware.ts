import { ACCESS_PASS } from "#/configs/global.config"
import { HttpStatusCode } from "#/configs/response.config"

import { NextFunction, Request, Response } from "express"

const validateDevices = (req: Request, res: Response, next: NextFunction) => {
    try {
        // HACK: Change to other auth method in the future
        const { accessCode } = req.body

        if (!accessCode || accessCode !== ACCESS_PASS) {
            return res.status(HttpStatusCode.UNAUTHORIZED).json({ message: "Unauthorized" })
        }

        next()
    } catch (error) {
        console.error("Auth middleware - validateDevices ERROR: " + (error as Error).message)
        return res.status(500).json({ message: "Internal server error" })
    }
}

export default validateDevices
