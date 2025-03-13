import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import catchAsync from "../utils/catchAsync";
import User from "../models/userModel";
import AppError from "../utils/appError";
import Email from "../utils/emails";
import crypto from "crypto";

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

  if (process.env.NODE_ENV === "production") {
    res.cookie("jwt", refreshToken, {
      expires: new Date(Date.now() + timeExpire * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
  }

  user.password = undefined;
  await User.findByIdAndUpdate(user._id, { refreshToken });

  res.status(statusCode).json({
    status: "success",
    accessToken,
    refreshToken,
    data: {
      user,
    },
  });
};

export const signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    fullName: req.body.fullName,
    email: req.body.email,
    numberPhone: req.body.numberPhone,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    gender: req.body.gender,
    dateOfBirth: req.body.dateOfBirth,
    address: req.body.address,
  });

  const url = "http://localhost:3000/login";

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
  const user = await User.findOne({ email }).select("+password");

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

    const currentUser = await User.findById(decoded.userId);

    if (currentUser) {
      await User.findByIdAndUpdate(
        decoded.userId,
        { refreshToken: null },
        { new: true }
      );
    }

    if (process.env.NODE_ENV === "production") {
      res.clearCookie("jwt", {
        httpOnly: true,
        secure: false,
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

  const currentUser = await User.findById(decoded.userId);

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
  if (req.cookies.jwt) {
    try {
      // 1) verify token

      const decoded = await verifyToken(
        req.cookies.jwt,
        process.env.JWT_SECRET as string
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
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

  const user = await User.findById(decoded.userId).select("+refreshToken");

  if (!user || user.refreshToken !== refreshToken) {
    return next(new AppError("Invalid refresh token!", 403));
  }

  const accessToken = signAccessToken(user._id as string);

  return res.json({ accessToken });
});

export const forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError("There is no user with email address.", 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    const resetURL = `http://localhost:3000/reset-password/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

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

export const resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  createSendToken(user, 200, req, res);
});

export const updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const idUser = req.user?.id || "";
  const user = await User.findById(idUser).select("+password");

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
