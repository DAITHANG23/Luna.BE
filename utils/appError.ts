class AppError extends Error {
  public messageError: string;
  public statusCode: number;
  public status: string;
  public isOperational: boolean;
  public errorCode: string;
  public fillWrongCurrentPasswordNumber: number;
  constructor(
    errorCode: string,
    message: string,
    statusCode: number,
    fillWrongCurrentPasswordNumber?: number,
  ) {
    super(message);

    this.errorCode = errorCode;
    this.messageError = message || 'Something went very wrong!';
    this.statusCode = statusCode || 500;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.fillWrongCurrentPasswordNumber = fillWrongCurrentPasswordNumber || 0;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
