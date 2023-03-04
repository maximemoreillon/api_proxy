import express from "express"
import dotenv from "dotenv"
import apiMetrics from "prometheus-api-metrics"
import { Request, Response, NextFunction, ErrorRequestHandler } from "express"
import { router } from "./routing"

dotenv.config()

const { PORT = 80 } = process.env

// Express error handling
// TODO: find type of error
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err)
  const { statusCode = 500, message } = err
  res.status(statusCode).send(message)
}

export const app = express()
app.use(apiMetrics())
app.use("/", router)
app.use(errorHandler)
app.listen(PORT, () => {
  console.log(`API proxy listening on port ${PORT}`)
})
