const express = require('express')
const dotenv = require('dotenv')
const httpProxy = require('http-proxy')
const pjson = require('./package.json')

dotenv.config()

const PORT = process.env.PORT || 80

const app = express()

const proxy = httpProxy.createProxy()

let handle_proxy = (req, res, options) => {
  // A wrapper for the proxy function
  proxy.web(req, res, options, (error) => {
    // error handling
    res.status(500).send(`The proxy failed to retrieve resource at ${process.env.PROXY_ROOT}`)
    console.log(error)
  })
}

app.get('/proxy', (req, res) => {

  let services = []
  for (var variable in process.env) {
    if(variable.startsWith('PROXY_')) {
      services.push({variable: variable, url: process.env[variable]})
    }
  }

  res.send({
    author: 'Maxime MOREILLON',
    application_name: pjson.name,
    version: pjson.version,
    services: services,
  })
})

app.all('/proxy/:service_name*', (req,res) => {

  const service_name = req.params.service_name
  const service_name_formatted = service_name.toUpperCase().replace(/-/g,'_')
  const target_hostname = process.env[`PROXY_${service_name_formatted}`]

  if(!target_hostname) {
    return res.status(404).send(`The Proxy is not configured to handle the service called '${service_name}'`)
  }

  const original_path = req.originalUrl

  // manage_path
  let path_split = original_path.split('/')

  // Remove /proxy/:service_name
  path_split.splice(1,2)
  const new_path =  path_split.join('/')

  // Assemble the target_url
  const target = `${target_hostname}${new_path}`

  // IgnorePath: true because we reconstruct the path ourselves here
  const proxy_options = { target, ignorePath: true}

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
