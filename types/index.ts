import { Document } from "mongoose";

type Gender = "male" | "female";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  passwordConfirm?: string;
  address: string;
  gender: Gender;
  birthOfDate: string;
  numberPhone: string;
  role: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  correctPassword(
    candidatePassword: string,
    userPassword: string
  ): Promise<boolean>;
  changedPasswordAfter(JWTTimestamp: number): boolean;
  createPasswordResetToken(): string;
}
