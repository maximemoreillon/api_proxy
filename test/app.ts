process.env.PATH_PREFIX = ""
process.env.PROXY_TEST_VALID = "http://localhost"
process.env.PROXY_TEST_INVALID = "http://localhost:4000"

import request from "supertest"
import { expect } from "chai"
import { app } from ".."

describe("/proxy", () => {
  before(async () => {
    //console.log = function () {};
  })

  describe("GET /proxy", () => {
    it("Should return app info", async () => {
      const { status } = await request(app).get("/proxy")
      expect(status).to.equal(200)
    })
  })

  describe("GET /", () => {
    it("Should return the GUI", async () => {
      const { status } = await request(app).get("/")
      expect(status).to.equal(200)
    })
  })

  describe("GET /test-valid", () => {
    it("Should proxy the test service", async () => {
      const { status } = await request(app).get("/test-valid")
      expect(status).to.equal(200)
    })
  })

  describe("GET /unregistered", () => {
    it("Should not allow proxying an unregistered service", async () => {
      const { status } = await request(app).get("/unregistered")
      expect(status).to.equal(404)
    })
  })

  describe("GET /test", () => {
    it("Should not proxy a service which does not work", async () => {
      const { status } = await request(app).get("/test-invalid")

      expect(status).to.equal(500)
    })
  })
})
