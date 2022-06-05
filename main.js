const express = require('express')
const dotenv = require('dotenv')
const apiMetrics = require('prometheus-api-metrics')
const history = require('connect-history-api-fallback')
const createHttpError = require('http-errors')
const { createProxy } = require('http-proxy')
const {
  name: application_name, 
  version, 
  author
} = require('./package.json')

dotenv.config()

const { 
  PORT = 80,
  PROXY_ROOT,
  PROXY_WS,
} = process.env

const app = express()
app.use(apiMetrics())

const proxy = createProxy()

const handle_proxy = (req, res, options) => {
  // A wrapper for the proxy function
  proxy.web(req, res, options, (error) => {
    res.status(500).send(error)
    console.error(error)
  })
}

app.get('/proxy', (req, res) => {

  const services = []
  for (let variable in process.env) {
    if(variable.startsWith('PROXY_')) {
      services.push({variable, url: process.env[variable]})
    }
  }

  res.send({
    author,
    application_name,
    version,
    services,
  })
})

app.all('/proxy/:service_name*', async (req,res, next) => {

  try {
    const { service_name } = req.params
    const service_name_formatted = service_name.toUpperCase().replace(/-/g, '_')
    const target_hostname = process.env[`PROXY_${service_name_formatted}`]

    if (!target_hostname) throw createHttpError(404, `The Proxy is not configured to handle the service called '${service_name}'`)

    const original_path = req.originalUrl

    // manage_path
    const path_split = original_path.split('/')

    // Remove /proxy/:service_name
    path_split.splice(1, 2)
    const new_path = path_split.join('/')

    // Assemble the target_url
    const target = `${target_hostname}${new_path}`

    // IgnorePath: true because we reconstruct the path ourselves here
    const proxy_options = { target, ignorePath: true }

    // Use the proxy with the given configuration  
    handle_proxy(req, res, proxy_options)
  }
  catch (error) {
    next(error)
  }
  
})

if (PROXY_WS) {
  app.all('/socket.io*', (req, res) => {
    // The route used for Websockets
    handle_proxy(req, res, { target: PROXY_WS })
  })
}


// Front-end
if (PROXY_ROOT) {
  // If PROXY_ROOT is set, then front-end at this URL is served
  app.get('/*', (req, res) => {
    // The route used for the front end
    handle_proxy(req, res, { target: PROXY_ROOT })
  })
}
else {
  // Serve the vue.js app
  app.use(express.static('dist'))

  // Always fall back to index.html
  app.use(history())
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