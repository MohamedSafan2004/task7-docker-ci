import bcrypt from "bcrypt";
import { prisma } from "../prisma";
import { Role, User } from "../generated/prisma/client";

//Find user by email

export const findUserByEmail = async (email: string): Promise<User | null> => {
  return prisma.user.findUnique({ where: { email } });
};

//create user ** it hash password before saving **
export const createUser = async (
  email: string,
  password: string,
  role: Role = "USER",
): Promise<User> => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: { email, password: hashedPassword, role },
  });
};
