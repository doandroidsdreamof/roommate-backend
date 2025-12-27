import { HttpException } from '@nestjs/common';
import { ErrorKey, ERRORS } from 'src/constants/errors';

export class DomainException extends HttpException {
  constructor(errorKey: ErrorKey, details?: Record<string, any>) {
    const error = ERRORS[errorKey];

    super(
      {
        message: error.message,
        code: error.code,
        details,
      },
      error.status,
    );
  }
}
