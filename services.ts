import dotenv from "dotenv"
import YAML from "yaml"
import { readFileSync } from "fs"

dotenv.config()

export interface Service {
  route: string
  host: string | undefined
}

const { PATH_PREFIX = "/proxy" } = process.env

const configFile = readFileSync("./config/config.yml", "utf8")
const servicesFromConfigFile: Service[] = YAML.parse(configFile).services

const servicesFromEnv: Service[] = Object.keys(process.env)
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
    }
  })

const getSlashCount = (input: string) => (input.match(/\//g) || []).length

export const services: Service[] = [
  ...servicesFromConfigFile,
  ...servicesFromEnv,
]
  // Sorting by character count and then number of "/" so as to order by specificity
  .sort((a, b) => b.route.length - a.route.length)
  .sort((a, b) => getSlashCount(b.route) - getSlashCount(a.route))
