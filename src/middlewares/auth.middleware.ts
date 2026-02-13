import { ACCESS_PASS } from "#/configs/env.config"
import { HttpStatusCode } from "#/configs/response.config"

import { NextFunction, Request, Response } from "express"

/**
 * Validate approved device to access server
 * @param req Access code to access server
 * @param res Status if catching error or missing access code
 * @param next Process to next routes after validated
 * @returns
 * - Error in response
 * - Approve to next route if accepted
 */
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
        return res.status(HttpStatusCode.INTERNAL_SERVER).json({ message: "Internal server error" })
    }
}

export default validateDevices
