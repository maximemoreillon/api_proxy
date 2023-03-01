# API proxy

[![pipeline status](https://gitlab.com/moreillon_ci/api_proxy/badges/master/pipeline.svg)](https://gitlab.com/moreillon_ci/api_proxy)
[![coverage report](https://gitlab.com/moreillon_ci/api_proxy/badges/master/coverage.svg)](https://gitlab.com/moreillon_ci/api_proxy)
![Docker Pulls](https://img.shields.io/docker/pulls/moreillon/api-proxy)
[![Artifact Hub](https://img.shields.io/endpoint?url=https://artifacthub.io/badge/repository/moreillon)](https://artifacthub.io/packages/search?repo=moreillon)

This is a simple API proxy / gateway for applications designed in a microservice architecture.

It is mainly used for GUIs designed as SPA to reach their back-end without prior knowledge of the IP or FQDN of the latter.

## API

| Route                 | Method | Description                                                                                                                                                                                                                                                                                                                                |
| --------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| /proxy                | GET    | Show server information                                                                                                                                                                                                                                                                                                                    |
| /proxy/{service name} | ANY    | Proxy the request to the corresponding service defined as environment variable. The name of the service maps to an environment variable prefixed with PROXY. hyphens are replaced by underscores. For example, if {service name} is my-service, then the request will be proxied to the value of the environment variable PROXY_MY_SERVICE |
| /                     | GET    | Proxies requests to the url defined by the variable PROXY_ROOT                                                                                                                                                                                                                                                                             |

## Environment variables

| Variable           | Description                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| PROXY_ROOT         | Sets the URL of the service to which requests to / are redirected                                                                     |
| PROXY_SERVICE_NAME | Sets the URL of the service to which requests to /proxy/service-name are redirected. Replace SERVICE_NAME by the name of your service |

Note: If PROXY_ROOT is not set, the service will serve static files from the dist directory instead.
