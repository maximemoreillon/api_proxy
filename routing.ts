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

const { PROXY_WS, PATH_PREFIX = "/proxy", IDENTIFICATION_URL } = process.env

export const router = Router()

const route_handler =
  ({ host, route }: Service) =>
  async (req: Request, res: Response) => {
    // Rewrite URL, i.e. remove /prefix/service/

    if (!host) throw `Host does not exist`

    const basePath = `${PATH_PREFIX}${route}`
    const newPath = req.originalUrl.replace(basePath, "")

    const new_url = newPath.startsWith("/")
      ? `${host}${newPath}`
      : `${host}/${newPath}`

    // IgnorePath: true because we reconstruct the path ourselves here
    const proxy_options = { target: new_url, ignorePath: true }

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
  })
})

// Authentication
if (IDENTIFICATION_URL) {
  console.log(`[Auth] Enabling authentication using ${IDENTIFICATION_URL}`)
  const auth_options = { url: IDENTIFICATION_URL }
  router.use(auth(auth_options))
}

// TODO: it is not a good idea to use the PROXY_prefix as it creates a route above
if (PROXY_WS) {
  router.all("/socket.io*", (req, res) => {
    handle_proxy(req, res, { target: PROXY_WS })
  })
}

// Register a route for each service
services.forEach(({ route, host }) => {
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