import dotenv from "dotenv";
dotenv.config();
import express from "express";
import "express-async-errors";
import cookieParser from "cookie-parser";
import http from "http";
import apiMetrics from "prometheus-api-metrics";
import { router } from "./routing";
import { errorHandler } from "./utils";
import { createProxyServer } from "http-proxy";
import {
  createOidcMiddleware,
  oidcInit,
  OIDC_AUTHORITY,
  OIDC_CLIENT_ID,
} from "./oidc";

const { PORT = 80, PROXY_SOCKETIO } = process.env;

export const app = express();
app.use(cookieParser());
app.use(apiMetrics());
if (OIDC_AUTHORITY && OIDC_CLIENT_ID) {
  oidcInit();
  app.use(createOidcMiddleware());
}
app.use("/", router);
app.use(errorHandler);

const server = http.createServer(app);

if (PROXY_SOCKETIO) {
  console.log(
    `PROXY_SOCKETIO is set, allowing WS upgrade to ${PROXY_SOCKETIO}`
  );
  const socketIoProxy = createProxyServer({
    ws: true,
    target: PROXY_SOCKETIO,
  });
  server.on("upgrade", socketIoProxy.ws);
}

server.listen(PORT, () => {
  console.log(`API proxy listening on port ${PORT}`);
});
