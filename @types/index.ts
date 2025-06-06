import { Document, Types } from "mongoose";

type Gender = "male" | "female";

export interface User extends Document {
  googleId: string;
  fullName: string;
  lastName: string;
  firstName: string;
  email: string;
  password: string;
  passwordConfirm?: string;
  address: string;
  gender: Gender;
  avatarId?: string;
  avatarUrl: string;
  dateOfBirth?: string;
  favorites: Array<Types.ObjectId>;
  checkInConcepts: Array<Types.ObjectId>;
  bookings: Array<Types.ObjectId>;
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

export interface IUserEmail extends Partial<User> {}

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
  lat: number;
  lng: number;
  address?: string;
}

export interface IRestaurant extends Document {
  name: string;
  description: string;
  address: string;
  numberPhone: string;
  bookingManager: Types.ObjectId;
  ratings: number;
  concept: Types.ObjectId;
  ratingsQuantity: number;
  ratingsAverage: number;
  priceDiscount: number;
  summary: string;
  active: boolean;
  location: ILocation;
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
  conceptManager: Types.ObjectId;
  totalProfit: number;
  images: Array<string>;
  imageCover: string;
  timeSlot: TimeSlotType;
  dishes: Array<Dish>;
  type: string;
  avgRatings: number;
  reviews: Array<string>;
}

export interface MulterFiles {
  imageCover: [File];
  images: Array<File>;
}

export interface IDishItem extends Document {
  image: string;
  name: string;
  price: number;
}

export type IStatusBooking =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED_BY_USER"
  | "CANCELLED_BY_ADMIN"
  | "NO_SHOW";

export interface StatusHistory {
  status: IStatusBooking;
  updatedAt: Date;
  updateBy: string;
}
export interface IBooking extends Document {
  customer: Types.ObjectId;
  restaurant: Types.ObjectId;
  timeOfBooking: string;
  timeSlot: string;
  fullName: string;
  numberPhone: string;
  email: string;
  peopleQuantity: string;
  notes: string;
  status: IStatusBooking;
  createdAt: Date;
  statusHistory?: Array<StatusHistory>;
  _updateBy?: string;
}

export type ITypeNotification =
  | "bookingCreated"
  | "bookingConfirmed"
  | "bookingCanceled"
  | "bookingInProgress"
  | "bookingCompleted";
export interface INotification extends Document {
  title: string;
  message: string;
  recipient: Types.ObjectId;
  read: boolean;
  createdAt: Date;
  type: ITypeNotification;
  // booking: Types.ObjectId;
  restaurant: Types.ObjectId;
  numberOfGuests: string;
  bookingDate: string;
}
