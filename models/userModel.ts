import crypto from "crypto";
import mongoose, { Query } from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import dayjs from "dayjs";
import { User } from "../@types/index";
import { Schema } from "mongoose";
const userSchema = new mongoose.Schema<User>(
  {
    googleId: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    fullName: {
      type: String,
      require: [true, "Please provider name."],
      minLength: [3, "Name must be at least 3 characters."],
      maxLength: [50, "Name must be maxium 50 characters."],
    },
    numberPhone: {
      type: String,
      require: [true, "Please provide number phone."],
      minLength: [10, "Number phone must be at least 10 digitals."],
      maxLength: [15, "Number phone must maxium 15 digitals."],
    },
    email: {
      type: String,
      require: [true, "Please provide email."],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email."],
    },
    role: {
      type: String,
      enum: [
        "admin",
        "user",
        "customer",
        "accountant",
        "restaurantManager",
        "conceptManager",
      ],
      default: "customer",
    },
    avatarId: {
      type: String,
    },
    avatarUrl: {
      type: String,
      default:
        "https://res.cloudinary.com/dn797d3j3/image/upload/v1741875000/avatarUsers/defaultAvatar_g02o8c.jpg",
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      default: "male",
    },
    address: {
      type: String,
      require: [true, "Please provide address."],
      minLength: [5, "Address must be at lease 5 characters"],
      maxLength: [100, "Address must be maxium 100 characters"],
      default: "Thong Nhat, Go Vap",
    },

    password: {
      type: String,
      require: [true, "Please provide password."],
      minlength: 8,
      select: false,
      match: [
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Password must have at least 8 characters, one uppercase, one lowercase, one number, and one special character.",
      ],
    },
    concept: {
      type: String,
      ref: "Concept",
      validate: {
        validator: function (v) {
          return this.role !== "customer" || !v;
        },
        message: "Customer can not have concept",
      },
    },
    restaurant: {
      type: String,
      ref: "Restaurant",
      validate: {
        validator: function (v) {
          return this.role !== "customer" || !v;
        },
        message: "Customer can not have restaurant",
      },
    },
    refreshToken: {
      type: String,
      select: false,
    },
    dateOfBirth: {
      type: String,
      require: [true, "Please provide birth of date."],
      default: "1997-05-23",
    },
    favorites: {
      type: [{ type: Schema.Types.ObjectId, ref: "Concept", required: true }],
      validate: {
        validator: function (v) {
          // Nếu không phải customer mà lại có favorites => sai
          return this.role === "customer" || v.length === 0;
        },
        message: "Only customers can have favorites",
      },
    },
    passwordConfirm: {
      type: String,
      require: [true, "Please provide password confirm"],
      validate: {
        // This only works on CREATE and SAVE!!!
        validator: function (el) {
          return el === this.password;
        },
        message: "Passwords are not the same!",
      },
    },
    otpCode: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  if (typeof this.password === "string") {
    this.password = await bcrypt.hash(this.password, 12);
  }

  this.passwordConfirm = undefined; // delete passwordConfirm field

  next();
});

userSchema.pre(/^find/, function (this: Query<any, Document>, next) {
  this.setQuery({ ...this.getQuery(), active: { $ne: false } });
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || !this.isNew) return next();

  if (this.passwordChangedAt instanceof Date) {
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }

  next();
});

userSchema.pre("save", function (next) {
  const minAgeDate = dayjs().subtract(13, "year").startOf("day");
  const dob = dayjs(this.dateOfBirth);

  if (!dob.isValid()) {
    return next(new Error("Invalid date of birth!"));
  }

  if (dob.isAfter(minAgeDate) || dob.isSame(minAgeDate)) {
    return next(new Error("User must be at least 13 years old!"));
  }

  next();
});

userSchema.methods.correctPassword = async (
  candidatePassword: string,
  userPassword: string
) => {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function (JWTTimestamp: number) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      String(this.passwordChangedAt.getTime() / 10000),
      10
    );
    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const UserModel = mongoose.model("User", userSchema);

export default UserModel;
