import { Request, Response, NextFunction } from "express";
import { User as AppUser } from "../@types/index";
declare global {
  namespace Express {
    interface User extends AppUser {}
    interface Request {
      user?: User;
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
