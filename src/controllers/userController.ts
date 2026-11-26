import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createUser, findUserByEmail } from "../services/userServices";
import { AuthRequest } from "../middleware/authMiddleware";

//controller to regster user
export const register = async (req: Request, res: Response) => {
  const email = req.body?.email;
  const password = req.body?.password;

  if (
    !email ||
    typeof email !== "string" ||
    !password ||
    typeof password !== "string"
  ) {
    res.status(400).json({ message: "Email and Password are required" });
    return;
  }

  if (await findUserByEmail(email)) {
    res.status(409).json({ message: "email allready registered" });
    return;
  }
  const newUser = await createUser(email, password);
  res
    .status(201)
    .json({ id: newUser.id, email: newUser.email, role: newUser.role });
};

//controller to login user and give token //

export const login = async (req: Request, res: Response) => {
  const email = req.body?.email;
  const password = req.body?.password;

  //check if there is email or password within request
  if (
    !email ||
    typeof email !== "string" ||
    !password ||
    typeof password !== "string"
  ) {
    res.status(400).json({ message: "Email and Password are required" });
    return;
  }

  //check is the user email exist or not
  const user = await findUserByEmail(email);
  if (!user) {
    res.status(401).json({ message: "invalid email or password" });
    return;
  }

  //check if the password the user entered is the same as the one in the database
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(401).json({ message: "invalid email or password" });
    return;
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ message: "server configuration error" });
    return;
  }

  const token = jwt.sign({ id: user.id, role: user.role }, secret, {
    expiresIn: "15m",
  });
  res.status(200).json({ token });
};

//protected route for any logged in user
export const getProfile = (req: AuthRequest, res: Response) => {
  res.status(200).json({ message: "welcome to ur porfile", user: req.user });
};

//protected route for ADMIN only
export const getAdminDashboard = (req: AuthRequest, res: Response) => {
  res.status(200).json({ message: "Welcome Admin", user: req.user });
};
