import "express";

declare global {
  namespace Express {
    interface Request {
      cachedData?: unknown;
    }
  }
}

export {};