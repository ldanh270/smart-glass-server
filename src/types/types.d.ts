export {}

declare global {
    namespace Express {
        interface Request {
            transcribedText?: string
        }
    }
}
