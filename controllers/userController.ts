import { NextFunction, Request, Response } from "express";
import multer, { FileFilterCallback } from "multer";
import sharp from "sharp";
import User from "../models/userModel";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import {
  getOne,
  getAll,
  updateOne,
  deleteOne,
} from "../controllers/handlerFactory";
import { uploadSingleImage } from "../utils/uploadImage";

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });
const multerStorage = multer.memoryStorage();

const multerFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(
      new Error("Not an image! Please upload only images.") as unknown as null,
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

export const uploadUserPhoto = upload.single("avatar");

export const singleUpload = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id || "";
    if (!req.file) {
      return next();
    }

    const result = await uploadSingleImage(req.file.buffer, "avatarUsers");
    if (!result?.secure_url) {
      return next(new AppError("Upload to Cloudinary failed", 500));
    }

    // Lưu URL avatar vào DB
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatarUrl: result.secure_url },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      message: "Upload successful",
      updatedUser,
      secure_url: result.secure_url,
      public_id: result.public_id,
    });
  }
);

export const resizeUserPhoto = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) return next();

    const userId = req.user?.id || "";
    req.file.filename = `user-${userId}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`public/img/users/${req.file.filename}`);

    next();
  }
);

const filterObj = <T extends Record<string, any>>(
  obj: T,
  ...allowedFields: (keyof T)[]
): Partial<T> => {
  const newObj: Partial<T> = {};
  Object.keys(obj).forEach((key) => {
    if (allowedFields.includes(key as keyof T)) {
      newObj[key as keyof T] = obj[key];
    }
  });
  return newObj;
};

export const getMe = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id || "";

  req.params.id = userId;
  next();
};

export const updateMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new AppError(
          "This route is not for password updates. Please use /updateMyPassword.",
          400
        )
      );
    }

    // 2) Filtered out unwanted fields names that are not allowed to be updated
    const filteredBody = filterObj(
      req.body,
      "fullName",
      "email",
      "address",
      "numberPhone",
      "dateOfBirth",
      "gender"
    );
    if (req.file) {
      const result = await uploadSingleImage(req.file.buffer, "avatarUsers");
      if (!result?.secure_url) {
        return next(new AppError("Upload to Cloudinary failed", 500));
      }
      console.log(result.secure_url);
      filteredBody.avatarUrl = result.secure_url;
    }

    console.log(filteredBody);

    // 3) Update user document
    const userId = req.user?.id || "";
    const updatedUser = await User.findByIdAndUpdate(userId, filteredBody, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      data: {
        user: updatedUser,
      },
    });
  }
);

export const deleteMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id || "";
    await User.findByIdAndUpdate(userId, { active: false });

    res.status(204).json({
      status: "success",
      data: null,
    });
  }
);

export const createUser = (req: Request, res: Response) => {
  res.status(500).json({
    status: "error",
    message: "This route is not defined! Please use /signup instead",
  });
};

export const getUser = getOne(User);
export const getAllUsers = getAll(User);

// Do NOT update passwords with this!
export const updateUser = updateOne(User);
export const deleteUser = deleteOne(User);
