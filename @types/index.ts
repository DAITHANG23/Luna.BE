import { Document, Types } from "mongoose";

type Gender = "male" | "female";

export interface IUser extends Document {
  googleId: string;
  fullName: string;
  email: string;
  password: string;
  passwordConfirm?: string;
  address: string;
  gender: Gender;
  avatarId?: string;
  avatarUrl: string;
  dateOfBirth: string;
  numberPhone: string;
  role: string;
  refreshToken?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  concept: string;
  restaurant: string;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  otpCode?: string;
  otpExpires?: Date;
  correctPassword(
    candidatePassword: string,
    userPassword: string
  ): Promise<boolean>;
  changedPasswordAfter(JWTTimestamp: number): boolean;
  createPasswordResetToken(): string;
}

export interface IUserEmail extends Partial<IUser> {}

export type CloudinaryUploadResult = {
  asset_id?: string;
  public_id: string;
  version?: number;
  width?: number;
  height?: number;
  format?: string;
  resource_type?: string;
  created_at?: string;
  bytes?: number;
  url?: string;
  secure_url: string;
  original_filename?: string;
};

export interface Dish extends Document {
  name: string;
  description: string;
  type: string;
  image: string;
  price: number;
}

export interface TimeSlotType extends Document {
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface ILocation {
  type: "Point";
  coordinate: number[];
  address?: string;
  description?: string;
}

export interface IRestaurant extends Document {
  name: string;
  description: string;
  address: string;
  numberPhone: string;
  bookingManager: Types.ObjectId;
  ratings: number;
  concept: Types.ObjectId;
  timeSlot: TimeSlotType;
  dishes: Array<Dish>;
  images: Array<string>;
  ratingsQuantity: number;
  priceDiscount: number;
  summary: string;
  imageCover: string;
  active: boolean;
  locations: Array<ILocation>;
  type: string;
  voucher: string;
  profit: number;
  totalSale: number;
  totalExpense: number;
  staffs: Array<Types.ObjectId>;
  createdAt: Date;
}

export interface IConcept extends Document {
  name: string;
  description: string;
  address: string;
  managerConcept: Types.ObjectId;
  totalProfit: number;
}
