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
import cloudinary from "cloudinary";

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

export const resizeUserPhoto = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) return next();

    req.file.buffer = await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toBuffer();

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
    const userId = req.user?.id || "";

    // 1) Ngăn chặn cập nhật password ở đây
    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new AppError(
          "This route is not for password updates. Please use /updateMyPassword.",
          400
        )
      );
    }

    // 2) Lọc bỏ các trường không được phép cập nhật
    const filteredBody = filterObj(
      req.body,
      "fullName",
      "email",
      "address",
      "numberPhone",
      "dateOfBirth",
      "gender"
    );

    // 3) Nếu có file ảnh, xử lý upload ảnh lên Cloudinary
    if (req.file) {
      try {
        const user = await User.findById(userId);

        // Nếu người dùng đã có avatar cũ, xóa nó trước khi upload ảnh mới
        if (user?.avatarId) {
          await cloudinary.v2.uploader.destroy(user.avatarId);
        }

        // Upload ảnh mới lên Cloudinary
        const result = await uploadSingleImage(req.file.buffer, "avatarUsers");
        if (!result?.secure_url) {
          return next(new AppError("Upload to Cloudinary failed", 500));
        }

        // Cập nhật thông tin avatar
        filteredBody.avatarUrl = result.secure_url;
        filteredBody.avatarId = result.public_id;
      } catch (error) {
        return next(new AppError("Internal server error", 500));
      }
    }

    // 4) Cập nhật user trong database
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
