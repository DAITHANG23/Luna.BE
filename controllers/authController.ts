/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import catchAsync from '@utils/catchAsync';
import UserModel from '@models/userModel';
import AppError from '@utils/appError';
import Email from '@utils/emails';
import crypto from 'crypto';
import { authenticator } from 'otplib';
import { User } from '../@types/index';
import redis from '@utils/redis';
import { ERROR_KEY } from '@utils/errorKey';

const isProd = process.env.NODE_ENV === 'production';

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
    throw new Error('JWT_SECRET is not defined!');
  }

  const payload = { userId: id };

  const optionsAccess: jwt.SignOptions = {
    expiresIn: '1h',
  };

  return jwt.sign(payload, secretKey, optionsAccess);
};

const createSendToken = async (
  user: User,
  statusCode: number,
  req: Request,
  res: Response,
) => {
  const sessionId = crypto.randomBytes(16).toString('hex');

  const ttlSeconds = 60 * 60 * 24 * 7;

  const accessToken = signAccessToken(user._id as string);

  if (isProd) {
    res.cookie('sessionId', sessionId, {
      expires: new Date(Date.now() + ttlSeconds * 1000),
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      domain: '.domiquefusion.store',
    });
  }

  await redis.set(`session:${sessionId}`, accessToken, 'EX', ttlSeconds);

  user.password = undefined;

  const responseData: any = {
    status: 'success',
    data: {
      user,
    },
  };

  if (!isProd) {
    responseData.sessionId = sessionId;
  }

  res.status(statusCode).json(responseData);
};

export const signup = catchAsync(async (req, res, next) => {
  const {
    fullName,
    firstName,
    lastName,
    email,
    numberPhone,
    password,
    passwordConfirm,
    dateOfBirth,
    address,
  } = req.body;

  const user = await UserModel.findOne({ email });

  if (user) {
    return next(
      new AppError(ERROR_KEY.EMAIL_IS_EXISTED, 'Email is existed!', 401),
    );
  }

  const requiredFields: Record<string, any> = {
    fullName,
    firstName,
    lastName,
    email,
    numberPhone,
    password,
    passwordConfirm,
    dateOfBirth,
    address,
  };

  const missingFields = (
    Object.keys(requiredFields) as Array<keyof typeof requiredFields>
  ).filter(key => !requiredFields[key]);

  if (missingFields.length) {
    return next(
      new AppError(
        ERROR_KEY.MISSING_FIELDS,
        `Missing Fields: ${missingFields.join(', ')} `,
        400,
      ),
    );
  }

  authenticator.options = { step: 90 };

  const secret = process.env.OTP_KEY_SECRET || '';

  const otp = authenticator.generate(secret);

  await redis.set(`otp:${email}`, otp, 'EX', 300);

  const userBody = {
    fullName,
    firstName,
    lastName,
    email,
    numberPhone,
    password,
    passwordConfirm,
    dateOfBirth,
    address,
  } as User;

  await new Email(userBody, '', otp).sendOTP();

  res.json({ message: 'OTP is sent, please check your email!' });
});

export const verifyOtp = catchAsync(async (req, res, next) => {
  const {
    fullName,
    firstName,
    lastName,
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
    firstName,
    lastName,
    email,
    numberPhone,
    password,
    passwordConfirm,
    gender,
    dateOfBirth,
    address,
  } as User;

  if (!userOtp) {
    return next(
      new AppError(
        ERROR_KEY.OTP_IS_NULL,
        'OTP is null. Please enter OTP!',
        400,
      ),
    );
  }

  const storedOtp = await redis.get(`otp:${email}`);

  if (!storedOtp) {
    return next(
      new AppError(ERROR_KEY.OTP_IS_EXPIRED, 'OTP expired or invalid', 401),
    );
  }

  if (userOtp !== storedOtp) {
    return next(
      new AppError(
        ERROR_KEY.OTP_IS_INCORRECT,
        'OTP is incorrect. Please enter OTP again',
        401,
      ),
    );
  }

  await redis.del(`otp:${email}`);

  const newUser = await UserModel.create(userBody);

  const url = `${process.env.FRONTEND_URL}/en/login`;

  await new Email(newUser, url).sendWelcome();

  res
    .status(200)
    .json({ status: 'success', message: 'Create account successfully!' });
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(
      new AppError(
        ERROR_KEY.MISSING_EMAIL_AND_PASSWORD,
        'Please provide email and password!',
        400,
      ),
    );
  }

  // 2) Check if user exists && password is correct
  const user = await UserModel.findOne({ email }).select('+password');

  if (!user) {
    return next(
      new AppError(ERROR_KEY.EMAIL_IS_NOT_EXISTED, 'Email is not exist', 401),
    );
  }

  if (
    !user ||
    !(await user.correctPassword(password, user.password as string))
  ) {
    return next(
      new AppError(ERROR_KEY.INCORRECT_PASSWORD, 'Incorrect password', 401),
    );
  }

  // 3) Check if user has entered the wrong password more than 5 times
  const fillWrongCurrentPasswordNumber = Number(
    await redis.get(`fillWrongCurrentPasswordNumber:${user.id}`),
  );

  if (fillWrongCurrentPasswordNumber >= 5) {
    return next(
      new AppError(
        ERROR_KEY.WRONG_CURRENT_PASSWORD_5_TIMES,
        'Your current password is wrong. You have 5 attempts left. If you enter the wrong password more than 5 times, your account will be locked for for 12 hours.',
        401,
        fillWrongCurrentPasswordNumber,
      ),
    );
  }
  // 4) If everything ok, send token to client
  createSendToken(user, 200, req, res);
});

export const logout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const sessionId = req.cookies.sessionId;

    if (!sessionId) {
      return next(
        new AppError(
          ERROR_KEY.ACCOUNT_NOT_LOGGED_IN,
          'You are not logged in! Please log in to get access.',
          401,
        ),
      );
    }

    await redis.del(`session:${sessionId}`);

    res.clearCookie('sessionId', {
      httpOnly: isProd ? true : false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    res.status(200).json({ status: 'success', message: 'Logged out' });
  },
);

export const protect = catchAsync(async (req, res, next) => {
  let sessionId = '';
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    sessionId = req.headers.authorization.split(' ')[1];
  } else {
    sessionId = req.cookies.sessionId;
  }
  if (!sessionId) {
    return next(
      new AppError(
        ERROR_KEY.ACCOUNT_NOT_LOGGED_IN,
        'You are not logged in! Please log in to get access.',
        401,
      ),
    );
  }

  const key = `session:${sessionId}`;
  const sessionData = await redis.get(key);

  if (!sessionData) {
    return res.status(401).json({ message: 'Session expired' });
  }

  const ttlSeconds = 60 * 60 * 24 * 7;
  await redis.expire(key, ttlSeconds);

  let decoded;
  try {
    decoded = await verifyToken(sessionData, process.env.JWT_SECRET as string);
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      const expiredData = jwt.decode(sessionData) as { userId: string } | null;
      if (!expiredData || !expiredData.userId) {
        return next(
          new AppError(
            ERROR_KEY.TOKEN_IS_INVALID,
            'Invalid token payload',
            401,
          ),
        );
      }

      const newAccessToken = signAccessToken(expiredData.userId);
      await redis.set(key, newAccessToken, 'EX', ttlSeconds);
      decoded = await verifyToken(
        newAccessToken,
        process.env.JWT_SECRET as string,
      );
    } else {
      return next(
        new AppError(ERROR_KEY.TOKEN_IS_INVALID, 'Invalid token', 401),
      );
    }
  }

  const currentUser = await UserModel.findById(decoded.userId);

  if (!currentUser) {
    return next(
      new AppError(
        ERROR_KEY.TOKEN_IS_INVALID,
        'The user belonging to this token does on longer exits.',
        401,
      ),
    );
  }
  if (isProd) {
    res.cookie('sessionId', sessionId, {
      expires: new Date(Date.now() + ttlSeconds * 1000),
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      domain: '.domiquefusion.store',
    });
  }

  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

export const isLoggedIn = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let sessionId = '';
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    sessionId = req.headers.authorization.split(' ')[1];
  } else {
    sessionId = req.cookies.sessionId;
  }

  if (sessionId) {
    try {
      const key = `session:${sessionId}`;
      const sessionData = await redis.get(key);

      if (!sessionData) {
        return next();
      }
      // 1) verify token
      let decoded;
      try {
        decoded = await verifyToken(
          sessionData,
          process.env.JWT_SECRET as string,
        );
      } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
          const expiredData = jwt.decode(sessionData) as {
            userId: string;
          } | null;
          if (expiredData && expiredData.userId) {
            const newAccessToken = signAccessToken(expiredData.userId);
            const ttlSeconds = 60 * 60 * 24 * 7;
            await redis.set(key, newAccessToken, 'EX', ttlSeconds);
            decoded = await verifyToken(
              newAccessToken,
              process.env.JWT_SECRET as string,
            );
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }

      // 2) Check if user still exists
      const currentUser = await UserModel.findById(decoded.userId);

      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      const newAccessToken = signAccessToken(currentUser._id as string);
      const ttlSeconds = 60 * 60 * 24 * 7;

      await redis.set(key, newAccessToken, 'EX', ttlSeconds);

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      if (!res.locals.user) {
        return res.status(401).json({ message: 'You must be logged in' });
      }
      return next();
    }
  }
  next();
};

export const restrictTo = (...roles: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role || '';

    if (!roles.includes(role)) {
      return next(
        new AppError(
          ERROR_KEY.NOT_HAVE_PERMISSION,
          'You do not have permission to perform this action',
          403,
        ),
      );
    }

    next();
  };
};

export const forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await UserModel.findOne({ email: req.body.email });

  authenticator.options = { step: 90 };

  const secret = process.env.OTP_KEY_SECRET || '';

  const otp = authenticator.generate(secret);

  if (!user) {
    return next(
      new AppError(
        ERROR_KEY.EMAIL_IS_NOT_EXISTED,
        'There is no user with email address.',
        404,
      ),
    );
  }

  user.otpCode = otp;
  user.otpExpires = new Date(Date.now() + 90 * 1000);

  await redis.set(`otp:${user.email}`, otp, 'EX', 300);
  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    const resetURL = `${process.env.FRONTEND_URL}/en/reset-password/${resetToken}`;

    await new Email(user, resetURL, otp).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        ERROR_KEY.SENDING_EMAIL_FAIL,
        'There was an error sending the email. Try again later!',
        500,
      ),
    );
  }
});

export const resendOtp = catchAsync(async (req, res, next) => {
  const user = await UserModel.findOne({ email: req.body.email });

  const { email } = req.body;

  if (!email) {
    return next(
      new AppError(ERROR_KEY.EMAIL_IS_REQUIRED, 'Email is required', 400),
    );
  }
  if (!user) {
    return next(
      new AppError(
        ERROR_KEY.EMAIL_IS_NOT_EXISTED,
        'There is no user with email address.',
        404,
      ),
    );
  }

  authenticator.options = { step: 90 };
  const secret = process.env.OTP_KEY_SECRET || '';
  const newOtp = authenticator.generate(secret);

  user.otpCode = newOtp;
  user.otpExpires = new Date(Date.now() + 90 * 1000);

  await redis.set(`otp:${email}`, newOtp, 'EX', 300);

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    const resetURL = `${process.env.FRONTEND_URL}/en/reset-password/${resetToken}`;
    await new Email(user, resetURL, newOtp).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'New OTP sent to email!',
    });
  } catch (error) {
    return next(
      new AppError(
        ERROR_KEY.SENDING_EMAIL_FAIL,
        'Error sending email. Try again later!',
        500,
      ),
    );
  }
});

export const resetPassword = catchAsync(async (req, res, next) => {
  const { otp, password, passwordConfirm, email } = req.body;

  if (!email) {
    return next(
      new AppError(ERROR_KEY.EMAIL_IS_REQUIRED, 'Email is required', 400),
    );
  }
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  if (!otp) {
    return next(
      new AppError(
        ERROR_KEY.OTP_IS_NULL,
        'OTP is null. Please enter OTP!',
        400,
      ),
    );
  }

  const user = await UserModel.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new AppError(
        ERROR_KEY.TOKEN_IS_INVALID,
        'Token is invalid or has expired',
        400,
      ),
    );
  }

  const storedOtp = await redis.get(`otp:${email}`);

  if (!user || !user.otpCode || !user.otpExpires || !storedOtp) {
    return next(
      new AppError(ERROR_KEY.INVALID_OTP_REQUEST, 'Invalid OTP request', 400),
    );
  }

  if (user.otpExpires < new Date()) {
    return next(
      new AppError(
        ERROR_KEY.OTP_IS_EXPIRED,
        'OTP has expired. Please request a new one',
        400,
      ),
    );
  }

  const isValidOtp = otp === storedOtp || otp === user.otpCode;

  if (!isValidOtp) {
    return next(
      new AppError(
        ERROR_KEY.INVALID_OTP_REQUEST,
        'OTP is invalid. Please enter OTP again',
        401,
      ),
    );
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
  const idUser = req.user?.id || '';
  const user = await UserModel.findById(idUser).select('+password');

  // 2) Check if POSTed current password is correct
  if (
    !user ||
    !(await user.correctPassword(
      req.body.passwordCurrent,
      user.password as string,
    ))
  ) {
    const fillWrongCurrentPasswordNumber =
      Number(await redis.get(`fillWrongCurrentPasswordNumber:${idUser}`)) || 0;

    await redis.set(
      `fillWrongCurrentPasswordNumber:${idUser}`,
      fillWrongCurrentPasswordNumber + 1,
      'EX',
      60 * 60 * 12,
    );

    if (fillWrongCurrentPasswordNumber >= 5) {
      return next(
        new AppError(
          ERROR_KEY.WRONG_CURRENT_PASSWORD_5_TIMES,
          'Your current password is wrong. You have 5 attempts left. If you enter the wrong password more than 5 times, your account will be locked for 12 hours.',
          401,
          fillWrongCurrentPasswordNumber,
        ),
      );
    }
    return next(
      new AppError(
        ERROR_KEY.WRONG_CURRENT_PASSWORD,
        'Your current password is wrong.',
        401,
        fillWrongCurrentPasswordNumber + 1,
      ),
    );
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
      const { user, sessionId } = req.user as any;

      if (!user || !sessionId) {
        return res.status(400).json({ message: 'Authentication failed' });
      }

      res.cookie('sessionId', sessionId, {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        httpOnly: isProd ? true : false,
        secure: isProd ? true : false,
        sameSite: isProd ? 'none' : 'lax',
        path: '/',
        domain: isProd ? '.domiquefusion.store' : undefined,
      });

      const redirectUrl = isProd
        ? `${process.env.FRONTEND_URL_PROD}`
        : `${process.env.FRONTEND_URL}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  },
);
