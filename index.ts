import dotenv from "dotenv"
dotenv.config()
import express from "express"
import apiMetrics from "prometheus-api-metrics"
import { router } from "./routing"
import { errorHandler } from "./utils"

const { PORT = 80 } = process.env

export const app = express()
app.use(apiMetrics())
app.use("/", router)
app.use(errorHandler)
app.listen(PORT, () => {
  console.log(`API proxy listening on port ${PORT}`)
})
