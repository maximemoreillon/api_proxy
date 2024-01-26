import dotenv from "dotenv"
dotenv.config()
import express from "express"
import "express-async-errors"
import http from "http"
import apiMetrics from "prometheus-api-metrics"
import { router } from "./routing"
import { errorHandler } from "./utils"
import { createProxyServer } from "http-proxy"

const { PORT = 80, PROXY_SOCKETIO } = process.env

export const app = express()
app.use(apiMetrics())
app.use("/", router)
app.use(errorHandler)

const server = http.createServer(app)

if (PROXY_SOCKETIO) {
  console.log(`PROXY_SOCKETIO is set, allowing WS upgrade to ${PROXY_SOCKETIO}`)
  const socketIoProxy = createProxyServer({
    ws: true,
    target: PROXY_SOCKETIO,
  })
  server.on("upgrade", socketIoProxy.ws)
}

server.listen(PORT, () => {
  console.log(`API proxy listening on port ${PORT}`)
})
