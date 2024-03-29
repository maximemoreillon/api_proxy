import { createProxy } from "http-proxy"
import { Request, Response } from "express"

export const proxy = createProxy()

export interface ProxyOptions {
  target: string
  ignorePath?: boolean
}

export const handle_proxy = (
  req: Request,
  res: Response,
  opts: ProxyOptions
) => {
  // A wrapper for the proxy function
  const options = { ...opts, secure: false }
  proxy.web(req, res, options, (error: Error) => {
    res.status(500).send(error)
    console.error(error)
  })
}
