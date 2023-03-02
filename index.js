const express = require("express")
const dotenv = require("dotenv")
const apiMetrics = require("prometheus-api-metrics")
const history = require("connect-history-api-fallback")
const { createProxy } = require("http-proxy")
const { name: application_name, version, author } = require("./package.json")

dotenv.config()

const { PORT = 80, PROXY_ROOT, PROXY_WS, PATH_PREFIX = "/proxy" } = process.env

const app = express()
app.use(apiMetrics())

const proxy = createProxy()

const handle_proxy = (req, res, opts) => {
  // A wrapper for the proxy function
  const options = { ...opts, secure: false }
  proxy.web(req, res, options, (error) => {
    res.status(500).send(error)
    console.error(error)
  })
}

const services = Object.keys(process.env)
  .filter((v) => v.startsWith("PROXY_") && v !== "PROXY_ROOT")
  .map((variable) => {
    const service = variable
      .split("PROXY_")[1]
      .toLocaleLowerCase()
      .replace(/_/g, "-")
    const route = `/${service}`
    return {
      route,
      host: process.env[variable],
      variable,
    }
  })

const route_handler =
  ({ host, route }) =>
  async (req, res, next) => {
    try {
      // Rewrite URL
      const basePath = `${PATH_PREFIX}${route}`
      const new_path = req.originalUrl.replace(basePath, "")
      const target = `${host}${new_path}`

      // IgnorePath: true because we reconstruct the path ourselves here
      const proxy_options = { target, ignorePath: true }

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
    path_prefix: PATH_PREFIX,
    root: PROXY_ROOT,
    services,
  })
})

services.forEach(({ route, host }) => {
  app.all(`${PATH_PREFIX}${route}*`, route_handler({ host, route }))
})

// TODO: it is not a good idea to use the WS_prefix as it creates a route above
if (PROXY_WS) {
  app.all("/socket.io*", (req, res) => {
    // The route used for Websockets
    handle_proxy(req, res, { target: PROXY_WS })
  })
}

// Front-end
if (PROXY_ROOT) {
  // If PROXY_ROOT is set, then front-end at this URL is served
  app.get("/*", (req, res) => {
    // The route used for the front end
    handle_proxy(req, res, { target: PROXY_ROOT })
  })
} else {
  console.log("PROXY_ROOT not configured, serving GUI from the /dist directory")
  // Always fall back to index.html
  app.use(history())
  // Serve the vue.js app
  app.use(express.static("dist"))
}

// Express error handling
app.use((err, req, res, next) => {
  console.error(err)
  const { statusCode = 500, message } = err
  res.status(statusCode).send(message)
})

app.listen(PORT, () => {
  console.log(`API proxy listening on port ${PORT}`)
})

exports.app = app
