import { NextFunction, Request, Response } from "express"
import multer, { FileFilterCallback } from "multer"

/**
 * Using Memory Storage
 * => Uploaded file will be temporary in RAM as Buffer (01001101...)
 * - Faster than Disk Storage (Uneccessary save to disk)
 * - Must limit file capacity to avoid Out of Memory error
 */
const storage = multer.memoryStorage()

/**
 * Validate input file
 * @param file Input file to validate
 * @param callback Execute funtion when filter finished
 * - Only accept audio files
 */
const fileFilter = (req: Request, file: Express.Multer.File, callback: FileFilterCallback) => {
    // Validate MIME type (Ex: audio/mpeg, audio/wav, audio/m4a)
    if (file.mimetype.startsWith("audio/")) {
        /*
            - null: No error
            - true: Accept file
         */
        callback(null, true)
    } else {
        /*
            - Error: File format invalid
            - false: Reject file
         */
        callback(new Error("Invalid file format! Only audio files are accepted") as any, false)
    }
}

/**
 * Create multer validate function with created configs
 */
const upload = multer({
    // Using memory storage
    storage: storage,
    // Using declared filter
    fileFilter: fileFilter,
    // Limit file capacity
    limits: {
        fileSize: 25 * 1024 * 1024, // Max file size - 25MB (Calculate by bytes)
    },
}).single("voice") // 'voice' is field name (key) in Request formData

/**
 * Handle Audio Upload middleware
 * - Catch errors in Multer & response JSON format
 */
export const handleAudioUpload = (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, (err) => {
        // Errors from Multer
        if (err instanceof multer.MulterError) {
            // Exceed limit file size
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    success: false,
                    message: "The file is too large! Upload file must not exceed 25MB.",
                })
            }
            // Missing voice field
            if (err.code === "LIMIT_UNEXPECTED_FILE") {
                return res.status(400).json({
                    success: false,
                    message: 'Missing upload file (in "voice" field)',
                })
            }
            // Other Multer errors
            return res.status(400).json({ success: false, message: err.message })
        }

        // Error from fileFilter
        if (err) {
            return res.status(400).json({ success: false, message: err.message })
        }

        // Missing voice file
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Missing voice files" })
        }

        next()
    })
}
