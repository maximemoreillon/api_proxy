const request = require("supertest")
const { expect } = require("chai")
const  { app } = require("../main.js")

describe('/proxy', () => {

    before(async () => {
        //console.log = function () {};
    })

    describe("GET /proxy", () => {
        it("Should return app info", async () => {
            const { status } = await request(app).get('/proxy')

            expect(status).to.equal(200)
        })
    })


    describe("GET /", () => {
        it("Should return GUI", async () => {
            const { status } = await request(app).get('/')

            expect(status).to.equal(200)
        })
    })

    describe("GET /proxy/test", () => {
        it("Should proxy the test service", async () => {
            const { status } = await request(app).get('/proxy/test-valid')

            expect(status).to.equal(200)
        })
    })

    describe("GET /proxy/unregistered", () => {
        it("Should not allow proxying an unregistered service", async () => {
            const { status } = await request(app).get('/proxy/unregistered')

            expect(status).to.equal(404)
        })
    })

    describe("GET /proxy/test", () => {
        it("Should not proxy a service which does not work", async () => {
            const { status } = await request(app).get('/proxy/test-invalid')

            expect(status).to.equal(500)
        })
    })




})

