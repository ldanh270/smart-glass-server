import { translateController } from "#/controllers/translate.controller"

import express from "express"

const translateRoutes = express.Router()

// List of recent conversations
translateRoutes.post("/", translateController.translateContent)

export default translateRoutes
