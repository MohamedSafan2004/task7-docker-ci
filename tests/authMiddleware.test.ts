import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";
import {
  authorizeRole,
  authenticateToken,
} from "../src/middleware/authMiddleware";
import { describe, it, expect } from "@jest/globals";

const SECRET = "test-secret";
process.env.JWT_SECRET = SECRET;

// mini app just for this test // one private route and one ADMIN only

const app = express();

app.get("/private", authenticateToken, (_req, res) => {
  res.status(200).json({ ok: true });
});

app.get("/admin", authenticateToken, authorizeRole("ADMIN"), (_req, res) => {
  res.status(200).json({ ok: true });
});

const makeToken = (role: "USER" | "ADMIN") =>
  jwt.sign({ id: 1, role }, SECRET, { expiresIn: "1h" });

// the private route
describe("authenticateToken", () => {
  it("returns 401 when there is no token", async () => {
    const res = await request(app).get("/private");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Access denied" });
  });

  it("returns 403 when token not valid", async () => {
    const res = await request(app)
      .get("/private")
      .set("Authorization", "Bearer not-a-real-token");

    expect(res.status).toBe(403);
  });

  it("returns 200 when the token is valid", async () => {
    const res = await request(app)
      .get("/private")
      .set("Authorization", `bearer ${makeToken("USER")}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});

// the ADMIN route

describe("authorizeRole", () => {
  it("returns 403 when a USER tries an ADMIN route", async () => {
    const res = await request(app)
      .get("/admin")
      .set("Authorization", `bearer ${makeToken("USER")}`);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Insufficient permissions" });
  });

  it("returns 200 when an ADMIN uses an ADMIN route", async () => {
    const res = await request(app)
      .get("/admin")
      .set("Authorization", `bearer ${makeToken("ADMIN")}`);

    expect(res.status).toBe(200);
  });
});
