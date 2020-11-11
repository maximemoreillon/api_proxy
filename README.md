# API proxy

A proxy server for microservices.

https://hub.docker.com/repository/docker/moreillon/api-proxy

## API

| Route | Method | Description |
| --- | --- | --- |
| /proxy | GET | Show server information |
| /proxy/{service name} | ANY | Proxy the request to the corresponding service defined as environment variable. The name of the service maps to an environment variable prefixed with PROXY. hyphens are replaced by underscores. For example, if {service name} is my-service, then the request will be proxied to the value of the environment variable PROXY_MY_SERVICE |
| / | GET | Proxies requests to the url defined by the variable PROXY_ROOT |

## Environment variables

| Variable |  Description |
| --- | --- |
| PROXY_ROOT | Sets the URL of the service to which requests to / are redirected |
| PROXY_SERVICE_NAME | Sets the URL of the service to which requests to /proxy/service-name are redirected |
