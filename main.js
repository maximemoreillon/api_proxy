const express = require('express')
const dotenv = require('dotenv')
const apiMetrics = require('prometheus-api-metrics')
const { createProxy } = require('http-proxy')
const {
  name: application_name, 
  version, 
  author
} = require('./package.json')

dotenv.config()

const { PORT = 80 } = process.env

const app = express()
app.use(apiMetrics())

const proxy = createProxy()

const handle_proxy = (req, res, options) => {
  // A wrapper for the proxy function
  proxy.web(req, res, options, (error) => {
    // error handling
    // This error message is shit
    res.status(500).send(`The proxy failed to retrieve resource from ${options.target}`)
    console.log(`The proxy failed to retrieve resource from ${options.target}: ${error}`)
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

app.all('/proxy/:service_name*', (req,res) => {

  const {service_name} = req.params
  const service_name_formatted = service_name.toUpperCase().replace(/-/g,'_')
  const target_hostname = process.env[`PROXY_${service_name_formatted}`]

  if(!target_hostname) {
    const message = `The Proxy is not configured to handle the service called '${service_name}'`
    console.log(message)
    return res.status(404).send(message)
  }

  const original_path = req.originalUrl

  // manage_path
  const path_split = original_path.split('/')

  // Remove /proxy/:service_name
  path_split.splice(1,2)
  const new_path =  path_split.join('/')

  // Assemble the target_url
  const target = `${target_hostname}${new_path}`

  // IgnorePath: true because we reconstruct the path ourselves here
  const proxy_options = { target, ignorePath: true}

  // Use the proxy with the given configuration  
  handle_proxy(req, res, proxy_options)
})

app.all('/socket.io*', (req, res) => {
  // The route used for Websockets
  const target = process.env.PROXY_WS
  handle_proxy(req, res, { target })
})

app.get('/*', (req, res) => {
  // The route used for the front end
  const target = process.env.PROXY_ROOT
  handle_proxy(req, res, { target })
})




app.listen(PORT, () => {
  console.log(`API proxy listening on port ${PORT}`)
})

exports.app = app