import express from "express"
import dotenv from "dotenv"
import apiMetrics from "prometheus-api-metrics"
import history from "connect-history-api-fallback"
import { createProxy } from "http-proxy"
import { name as application_name, version, author } from "./package.json"
import { Request, Response, NextFunction } from "express"

dotenv.config()

const { PORT = 80, PROXY_ROOT, PROXY_WS, PATH_PREFIX = "/proxy" } = process.env

export const app = express()
app.use(apiMetrics())

const proxy = createProxy()

interface ProxyOptions {
  target: string
  ignorePath?: boolean
}

interface Service {
  route: string
  host: string | undefined
  variable?: string
}

const handle_proxy = (req: Request, res: Response, opts: ProxyOptions) => {
  // A wrapper for the proxy function
  const options = { ...opts, secure: false }
  proxy.web(req, res, options, (error: Error) => {
    res.status(500).send(error)
    console.error(error)
  })
}

const getSlashCount = (input: string) => (input.match(/\//g) || []).length

const services: Service[] = Object.keys(process.env)
  .filter((v) => v.startsWith("PROXY_") && !["PROXY_WS"].includes(v))
  .map((variable) => {
    const serviceName = variable
      .split("PROXY_")[1]
      .toLocaleLowerCase()
      .replace(/_/g, "-")

    // PROXY_ROOT is a special route which cannot be prefixed
    const route = serviceName === "root" ? `/` : `${PATH_PREFIX}/${serviceName}`
    return {
      route,
      host: process.env[variable],
      variable,
    }
  })
  // Sorting by character count and then number of "/" so as to order by specificity
  .sort((a, b) => b.route.length - a.route.length)
  .sort((a, b) => getSlashCount(b.route) - getSlashCount(a.route))

const route_handler =
  ({ host, route }: Service) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Rewrite URL, i.e. remove /prefix/service/

      if (!host) throw `Host does not exist`

      const basePath = `${PATH_PREFIX}${route}`
      const new_path = req.originalUrl.replace(basePath, "")
      const new_url = new URL(host)
      new_url.pathname = new_path

      // IgnorePath: true because we reconstruct the path ourselves here
      const proxy_options = { target: new_url.toString(), ignorePath: true }

      // Use the proxy with the given configuration
      handle_proxy(req, res, proxy_options)
    } catch (error) {
      next(error)
    }
  }

// TODO: consider renaming
app.get("/proxy", (req, res) => {
  res.send({
    author,
    application_name,
    version,
    services,
  })
})

services.forEach(({ route, host }) => {
  app.all(`${route}*`, route_handler({ host, route }))
})

// TODO: it is not a good idea to use the PROXY_prefix as it creates a route above
if (PROXY_WS) {
  app.all("/socket.io*", (req, res) => {
    // The route used for Websockets
    handle_proxy(req, res, { target: PROXY_WS })
  })
}

if (!PROXY_ROOT) {
  // Serving app from the dist directory
  console.log("PROXY_ROOT not configured, serving GUI from the /dist directory")
  // Always fall back to index.html
  app.use(history())
  app.use(express.static("dist"))
}

// Express error handling
// TODO: find type of error
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err)
  const { statusCode = 500, message } = err
  res.status(statusCode).send(message)
})

app.listen(PORT, () => {
  console.log(`API proxy listening on port ${PORT}`)
})
