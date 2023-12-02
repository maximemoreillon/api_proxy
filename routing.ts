import express from "express"
import "express-async-errors"
import history from "connect-history-api-fallback"
import { name as application_name, version, author } from "./package.json"
import { Request, Response } from "express"
import auth from "@moreillon/express_identification_middleware"
import type { Service } from "./services"
import { services } from "./services"
import { handle_proxy } from "./proxy"
import { Router } from "express"
import dotenv from "dotenv"

dotenv.config()

const { PROXY_SOCKETIO, IDENTIFICATION_URL } = process.env

export const router = Router()

// TODO: route is a confusing name, rename
const route_handler =
  ({ host, route }: Service) =>
  async (req: Request, res: Response) => {
    // Rewrite URL, i.e. remove /prefix/service/, i.e. route

    if (!host) throw `Host does not exist`

    const newPath = req.originalUrl.replace(route, "")

    // TODO: not very nice
    const newUrl = newPath.startsWith("/")
      ? `${host}${newPath}`
      : `${host}/${newPath}`

    // IgnorePath: true because we reconstruct the path ourselves here
    const proxy_options = { target: newUrl, ignorePath: true }

    // Use the proxy with the given configuration
    handle_proxy(req, res, proxy_options)
  }

// TODO: consider renaming
router.get("/proxy", (req, res) => {
  res.send({
    author,
    application_name,
    version,
    services,
    auth: {
      url: IDENTIFICATION_URL,
    },
    socketIo: PROXY_SOCKETIO,
  })
})

// Authentication
if (IDENTIFICATION_URL) {
  console.log(`[Auth] Enabling authentication using ${IDENTIFICATION_URL}`)
  const auth_options = { url: IDENTIFICATION_URL }
  router.use(auth(auth_options))
}

// TODO: it is not a good idea to use the PROXY_prefix as it creates a route above
// TODO: can only be set using environment variables
if (PROXY_SOCKETIO) {
  console.log(`Registering /socket.io* to proxy ${PROXY_SOCKETIO}`)
  router.all("/socket.io*", (req, res) => {
    handle_proxy(req, res, { target: PROXY_SOCKETIO })
  })
}

// Register a route for each service
services.forEach(({ route, host }) => {
  console.log(`Registering ${route} to proxy ${host}`)
  router.all(`${route}*`, route_handler({ host, route }))
})

const root_configured = services.some((s) => s.route === `/`)
if (!root_configured) {
  // Serving app from the dist directory
  console.log(
    "Root service not configured, serving GUI from the /dist directory"
  )
  // Always fall back to index.html
  router.use(history())
  router.use(express.static("dist"))
}

process.on("SIGINT", function () {
  process.exit()
})
