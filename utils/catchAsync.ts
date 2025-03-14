import { Request, Response, NextFunction } from "express";
import { IUser } from "../@types";
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
const catchAsync = <T = any>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
};

export default catchAsync;
