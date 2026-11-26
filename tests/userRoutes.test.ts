/// <reference types="jest" />
import request from "supertest";
import bcrypt from "bcrypt";

process.env.JWT_SECRET = "test-secret";

// Fake everything that talks to the outside world
jest.mock("../src/config/redis", () => ({
  __esModule: true,
  default: { sendCommand: jest.fn() },
  connectRedis: jest.fn(),
}));

jest.mock("../src/prisma", () => ({ prisma: {} }));

jest.mock("../src/middleware/rateLimiter", () => ({
  loginLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("../src/services/userServices", () => ({
  findUserByEmail: jest.fn(),
  createUser: jest.fn(),
}));

import app from "../src/app";
import { findUserByEmail, createUser } from "../src/services/userServices";

beforeEach(() => {
  jest.resetAllMocks();
});

describe("POST /api/auth/register", () => {
  it("returns 400 when email and password are missing", async () => {
    const res = await request(app).post("/api/auth/register").send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Email and Password are required" });
  });

  it("returns 409 when the email is already registered", async () => {
    jest.mocked(findUserByEmail).mockResolvedValue({
      id: 1,
      email: "ali@test.com",
      password: "hashed",
      role: "USER",
      createdAt: new Date(),
    });

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "ali@test.com", password: "123456" });

    expect(res.status).toBe(409);
  });

  it("returns 201 and never leaks the password", async () => {
    jest.mocked(findUserByEmail).mockResolvedValue(null);
    jest.mocked(createUser).mockResolvedValue({
      id: 1,
      email: "ali@test.com",
      password: "hashed",
      role: "USER",
      createdAt: new Date(),
    });

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "ali@test.com", password: "123456" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 1, email: "ali@test.com", role: "USER" });
  });
});

describe("POST /api/auth/login", () => {
  it("returns 401 when the password is wrong", async () => {
    jest.mocked(findUserByEmail).mockResolvedValue({
      id: 1,
      email: "ali@test.com",
      password: await bcrypt.hash("right-password", 4),
      role: "USER",
      createdAt: new Date(),
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "ali@test.com", password: "wrong-password" });

    expect(res.status).toBe(401);
  });

  it("returns 200 and a token when the credentials are correct", async () => {
    jest.mocked(findUserByEmail).mockResolvedValue({
      id: 1,
      email: "ali@test.com",
      password: await bcrypt.hash("right-password", 4),
      role: "USER",
      createdAt: new Date(),
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "ali@test.com", password: "right-password" });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
  });
});

describe("GET /api/auth/profile", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/auth/profile");

    expect(res.status).toBe(401);
  });
});
