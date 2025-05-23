import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import catchAsync from "../utils/catchAsync";
import UserModel from "../models/userModel";
import AppError from "../utils/appError";
import Email from "../utils/emails";
import crypto from "crypto";
import { authenticator } from "otplib";
import { User, IUserEmail } from "../@types/index";
import redis from "../utils/redis";

const verifyToken = (token: string, secret: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) reject(err);
      else resolve(decoded);
    });
  });
};

const signAccessToken = (id: string) => {
  const secretKey = process.env.JWT_SECRET;

  if (!secretKey) {
    throw new Error("JWT_SECRET is not defined!");
  }

  const payload = { userId: id };

  const optionsAccess: jwt.SignOptions = {
    expiresIn: "1h",
  };

  return jwt.sign(payload, secretKey, optionsAccess);
};

const signRefreshToken = (id: string) => {
  const secretKey = process.env.REFRESH_SECRET;

  if (!secretKey) {
    throw new Error("REFRESH_SECRET is not defined!");
  }

  const payload = { userId: id };

  const optionsRefresh: jwt.SignOptions = {
    expiresIn: "30d",
  };

  return jwt.sign(payload, secretKey, optionsRefresh);
};

const createSendToken = async (
  user: any,
  statusCode: number,
  req: Request,
  res: Response
) => {
  const accessToken = signAccessToken(user._id);

  const refreshToken = signRefreshToken(user._id);

  const timeExpire = Number(process.env.REFRESH_TOKEN_EXPIRED_IN);

  const isProd = process.env.NODE_ENV === "production";

  // when deploy vps will use this code
  if (process.env.NODE_ENV === "production") {
    res.cookie("jwt", refreshToken, {
      expires: new Date(Date.now() + timeExpire * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
  }

  user.password = undefined;
  await UserModel.findByIdAndUpdate(user._id, { refreshToken });

  const responseData: any = {
    status: "success",
    accessToken,
    data: {
      user,
    },
  };

  if (!isProd) {
    responseData.refreshToken = refreshToken;
  }

  res.status(statusCode).json(responseData);
};

export const signup = catchAsync(async (req, res, next) => {
  const {
    fullName,
    email,
    numberPhone,
    password,
    passwordConfirm,
    dateOfBirth,
    address,
  } = req.body;

  const user = await UserModel.findOne({ email });

  if (user) {
    return next(new AppError("Email is existed!", 401));
  }

  const requiredFields: Record<string, any> = {
    fullName,
    email,
    numberPhone,
    password,
    passwordConfirm,
    dateOfBirth,
    address,
  };

  const missingFields = (
    Object.keys(requiredFields) as Array<keyof typeof requiredFields>
  ).filter((key) => !requiredFields[key]);

  if (missingFields.length) {
    return next(
      new AppError(`Missing Fields: ${missingFields.join(", ")} `, 400)
    );
  }

  authenticator.options = { step: 90 };

  const secret = process.env.OTP_KEY_SECRET || "";

  const otp = authenticator.generate(secret);

  await redis.set(`otp:${email}`, otp, "EX", 300);

  const userBody = {
    fullName,
    email,
    numberPhone,
    password,
    passwordConfirm,
    dateOfBirth,
    address,
  } as User;

  await new Email(userBody, "", otp).sendOTP();

  res.json({ message: "OTP is sent, please check your email!" });
});

export const verifyOtp = catchAsync(async (req, res, next) => {
  const {
    fullName,
    email,
    numberPhone,
    password,
    passwordConfirm,
    gender,
    dateOfBirth,
    address,
  } = req.body;

  const userOtp = req.body.otp;

  const userBody = {
    fullName,
    email,
    numberPhone,
    password,
    passwordConfirm,
    gender,
    dateOfBirth,
    address,
  } as User;

  if (!userOtp) {
    return next(new AppError("OTP is null. Please enter OTP!", 400));
  }

  const storedOtp = await redis.get(`otp:${email}`);

  if (!storedOtp) {
    return next(new AppError("OTP expired or invalid", 401));
  }

  if (userOtp !== storedOtp) {
    return next(new AppError("OTP is incorrect. Please enter OTP again", 401));
  }

  await redis.del(`otp:${email}`);

  const newUser = await UserModel.create(userBody);

  const url = `${process.env.FRONTEND_URL}/login`;

  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, req, res);
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }
  // 2) Check if user exists && password is correct
  const user = await UserModel.findOne({ email }).select("+password");

  if (!user) {
    return next(new AppError("Email is not exist", 401));
  }

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }
  // 3) If everything ok, send token to client
  createSendToken(user, 200, req, res);
});

export const logout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(
        new AppError("You are not logged in! Please log in to get access.", 401)
      );
    }

    const decoded = await verifyToken(
      refreshToken,
      process.env.REFRESH_SECRET as string
    );

    const currentUser = await UserModel.findById(decoded.userId);

    if (currentUser) {
      await UserModel.findByIdAndUpdate(
        decoded.userId,
        { refreshToken: null },
        { new: true }
      );
    }
    // when deploy vercel will use this code
    if (process.env.NODE_ENV === "production") {
      res.clearCookie("jwt", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });
    }

    res.status(200).json({ status: "success", message: "Logged out" });
  }
);

export const protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  const decoded = await verifyToken(token, process.env.JWT_SECRET as string);

  const currentUser = await UserModel.findById(decoded.userId);

  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does on longer exits.",
        401
      )
    );
  }

  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

export const isLoggedIn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // const token =
  //   process.env.NODE_ENV === "production"
  //     ? req.cookies.jwt
  //     : req.body.refreshToken;
  // const token = req.body.refreshToken;

  if (req.body.refreshToken) {
    try {
      // 1) verify token
      const decoded = await verifyToken(
        req.body.refreshToken,
        process.env.JWT_SECRET as string
      );

      // 2) Check if user still exists
      const currentUser = await UserModel.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

export const restrictTo = (...roles: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // roles ['admin', 'lead-guide']. role='user'
    const role = req.user?.role || "";

    if (!roles.includes(role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
  };
};

export const refreshToken = catchAsync(async (req, res, next) => {
  let refreshToken;

  if (process.env.NODE_ENV === "production") {
    refreshToken = req.cookies.jwt;
  } else {
    refreshToken = req.body.refreshToken;
  }

  if (!refreshToken) return next(new AppError("Refresh token missing!", 401));

  const secretKey = process.env.REFRESH_SECRET;
  if (!secretKey)
    return next(new AppError("Server error: Missing REFRESH_SECRET", 500));

  const decoded = await verifyToken(refreshToken, secretKey);

  const user = await UserModel.findById(decoded.userId).select("+refreshToken");

  if (!user || user.refreshToken !== refreshToken) {
    return next(new AppError("Invalid refresh token!", 403));
  }

  const accessToken = signAccessToken(user._id as string);

  return res.json({ accessToken });
});

export const forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await UserModel.findOne({ email: req.body.email });

  authenticator.options = { step: 90 };

  const secret = process.env.OTP_KEY_SECRET || "";

  const otp = authenticator.generate(secret);

  if (!user) {
    return next(new AppError("There is no user with email address.", 404));
  }

  user.otpCode = otp;
  user.otpExpires = new Date(Date.now() + 90 * 1000);
  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await new Email(user, resetURL, otp).sendPasswordReset();

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "There was an error sending the email. Try again later!",
        500
      )
    );
  }
});

export const resendOtp = catchAsync(async (req, res, next) => {
  const user = await UserModel.findOne({ email: req.body.email });

  const { email } = req.body;

  let userInfo: IUserEmail = { email, fullName: "Customer" };
  if (!email) {
    return next(new AppError("Email is required", 400));
  }

  authenticator.options = { step: 90 };
  const secret = process.env.OTP_KEY_SECRET || "";
  const newOtp = authenticator.generate(secret);

  if (user) {
    user.otpCode = newOtp;
    user.otpExpires = new Date(Date.now() + 90 * 1000);

    userInfo = {
      email: user.email || email,
      fullName: user.fullName || "Customer",
    };
    await user.save({ validateBeforeSave: false });
  }

  await redis.set(`otp:${email}`, newOtp, "EX", 300);

  try {
    await new Email(userInfo, "", newOtp).sendPasswordReset();

    res.status(200).json({
      status: "success",
      message: "New OTP sent to email!",
    });
  } catch (error) {
    return next(new AppError("Error sending email. Try again later!", 500));
  }
});

export const resetPassword = catchAsync(async (req, res, next) => {
  const { otp, password, passwordConfirm, email } = req.body;

  if (!email) {
    return next(new AppError("Email is required", 400));
  }
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  if (!otp) {
    return next(new AppError("OTP is null. Please enter OTP!", 400));
  }

  const user = await UserModel.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  const storedOtp = await redis.get(`otp:${email}`);

  if (!user || !user.otpCode || !user.otpExpires || !storedOtp) {
    return next(new AppError("Invalid OTP request", 400));
  }

  if (user.otpExpires < new Date()) {
    return next(new AppError("OTP has expired. Please request a new one", 400));
  }

  const isValidOtp = otp === storedOtp || otp === user.otpCode;

  if (!isValidOtp) {
    return next(new AppError("OTP is invalid. Please enter OTP again", 401));
  }

  await redis.del(`otp:${email}`);
  // 2) If token has not expired, and there is user, set the new password

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.otpCode = undefined;
  user.otpExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  createSendToken(user, 200, req, res);
});

export const updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const idUser = req.user?.id || "";
  const user = await UserModel.findById(idUser).select("+password");

  // 2) Check if POSTed current password is correct
  if (
    !user ||
    !(await user.correctPassword(req.body.passwordCurrent, user.password))
  ) {
    return next(new AppError("Your current password is wrong.", 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT
  createSendToken(user, 200, req, res);
});

export const googleAuthCallback = catchAsync(
  async (req: Request, res: Response) => {
    try {
      const { user, accessToken, refreshToken } = req.user as any;

      if (!user || !accessToken) {
        return res.status(400).json({ message: "Authentication failed" });
      }

      const isProd = process.env.NODE_ENV === "production";

      const timeExpire = Number(process.env.REFRESH_TOKEN_EXPIRED_IN);

      if (isProd) {
        res.cookie("jwt", refreshToken, {
          expires: new Date(Date.now() + timeExpire * 24 * 60 * 60 * 1000),
          httpOnly: true,
          secure: true,
          sameSite: "none",
        });
      }

      const redirectUrl = isProd
        ? `${process.env.FRONTEND_URL_PROD}/?accessToken=${accessToken}`
        : `${process.env.FRONTEND_URL}/?accessToken=${accessToken}&refreshToken=${refreshToken}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
);
