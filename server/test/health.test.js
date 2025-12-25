import { createRequire } from "module";
import { connectTestDB, disconnectTestDB } from "./setup.js";
import app from "../index.js";

// Bridge CommonJS modules into ESM
const require = createRequire(import.meta.url);
const chai = require("chai");
const chaiHttp = require("chai-http");

chai.use(chaiHttp);
const { expect } = chai;

describe("Health Check API", () => {
  // Connect to database before all tests
  before(async () => {
    await connectTestDB();
  });

  // Disconnect from database after all tests
  after(async () => {
    await disconnectTestDB();
  });

  describe("GET /", () => {
    it("should return API running message", (done) => {
      chai
        .request(app)
        .get("/")
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property("message", "API is running...");
          done();
        });
    });
  });

  describe("GET /api/secret (Protected Route)", () => {
    it("should return 401 without token", (done) => {
      chai
        .request(app)
        .get("/api/secret")
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });

    it("should return 401 with invalid token", (done) => {
      chai
        .request(app)
        .get("/api/secret")
        .set("Authorization", "Bearer invalid-token")
        .end((err, res) => {
          expect(res).to.have.status(403);
          done();
        });
    });
  });
});
