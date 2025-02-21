class AppError extends Error {
  public messageError: string;
  public statusCode: number;
  public status: string;
  public isOperational: boolean;
  constructor(message: string, statusCode: number) {
    super(message);

    this.messageError = message || "Something went very wrong!";
    this.statusCode = statusCode || 500;
    this.status = `${statusCode}`.startsWith("4") ? " fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
