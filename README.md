# API proxy

[![pipeline status](https://gitlab.com/moreillon_ci/api_proxy/badges/master/pipeline.svg)](https://gitlab.com/moreillon_ci/api_proxy)
[![coverage report](https://gitlab.com/moreillon_ci/api_proxy/badges/master/coverage.svg)](https://gitlab.com/moreillon_ci/api_proxy)

The front-end of web applications are designed to run in the client's web browser. As such, front-ends might not get access to some resources on the back-end. For instance, for an application built in a microservice architecture where services are orchestrated in Kubernetes, the front-end might not have access to some of the services unless those are configured accordingly.

This application can be used to proxy requests from the front-end internally so as to fetch the required resources.

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
