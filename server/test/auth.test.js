import { createRequire } from "module";
import { connectTestDB, disconnectTestDB } from "./setup.js";
import app from "../index.js";
import User from "../models/User.js";

// Bridge CommonJS modules into ESM
const require = createRequire(import.meta.url);
const chai = require("chai");
const chaiHttp = require("chai-http");

chai.use(chaiHttp);
const { expect } = chai;

describe("Authentication API", () => {
  // Connect to test DB once
  before(async () => {
    await connectTestDB();
  });

  // Disconnect after all tests
  after(async () => {
    await disconnectTestDB();
  });

  // Clear users before each test
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user with valid data", (done) => {
      const userData = {
        email: "test@example.com",
        password: "password123",
      };

      chai
        .request(app)
        .post("/api/auth/register")
        .send(userData)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property("message");
          expect(res.body).to.have.property("user");
          expect(res.body.user).to.have.property("email", "test@example.com");
          expect(res.body.user).to.have.property("role", "staff");
          expect(res.body.user).to.not.have.property("password");
          done();
        });
    });

    it("should not register user with missing email", (done) => {
      chai
        .request(app)
        .post("/api/auth/register")
        .send({ password: "password123" })
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property("error");
          done();
        });
    });

    it("should not register user with missing password", (done) => {
      chai
        .request(app)
        .post("/api/auth/register")
        .send({ email: "test@example.com" })
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property("error");
          done();
        });
    });

    it("should not register user with invalid email format", (done) => {
      chai
        .request(app)
        .post("/api/auth/register")
        .send({
          email: "invalid-email",
          password: "password123",
        })
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property("error");
          done();
        });
    });

    it("should not register user with password less than 6 characters", (done) => {
      chai
        .request(app)
        .post("/api/auth/register")
        .send({
          email: "test@example.com",
          password: "12345",
        })
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property("error");
          done();
        });
    });

    it("should not register duplicate email", (done) => {
      const userData = {
        email: "test@example.com",
        password: "password123",
      };

      chai
        .request(app)
        .post("/api/auth/register")
        .send(userData)
        .end(() => {
          chai
            .request(app)
            .post("/api/auth/register")
            .send(userData)
            .end((err, res) => {
              expect(res).to.have.status(400);
              expect(res.body).to.have.property("error");
              done();
            });
        });
    });

    it("should register user with admin role when specified", (done) => {
      chai
        .request(app)
        .post("/api/auth/register")
        .send({
          email: "admin@example.com",
          password: "password123",
          role: "admin",
        })
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body.user).to.have.property("role", "admin");
          done();
        });
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await User.create({
        email: "test@example.com",
        password: "password123",
        role: "staff",
      });
    });

    it("should login with valid credentials", (done) => {
      chai
        .request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property("message", "Login successful");
          expect(res.body).to.have.property("token");
          expect(res.body.user).to.have.property("email", "test@example.com");
          done();
        });
    });

    it("should not login with incorrect password", (done) => {
      chai
        .request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "wrongpassword",
        })
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property("error");
          done();
        });
    });

    it("should not login with non-existent email", (done) => {
      chai
        .request(app)
        .post("/api/auth/login")
        .send({
          email: "missing@example.com",
          password: "password123",
        })
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property("error");
          done();
        });
    });

    it("should not login with missing email", (done) => {
      chai
        .request(app)
        .post("/api/auth/login")
        .send({ password: "password123" })
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property("error");
          done();
        });
    });

    it("should not login with missing password", (done) => {
      chai
        .request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com" })
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property("error");
          done();
        });
    });
  });
});
