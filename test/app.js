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




})

