import { translateController } from "#/controllers/translate.controller"
import { handleAudioUpload } from "#/middlewares/upload.middleware"

import express from "express"

const translateRoutes = express.Router()

// List of recent conversations
translateRoutes.post("/", handleAudioUpload, translateController.translateContent)

export default translateRoutes
