import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export type Response<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: PaginationMeta;
  timestamp: string;
};

export type ErrorResponse = {
  success: boolean;
  statusCode: number;
  message: string;
  error: {
    name: string;
    details?: any;
  };
  path: string;
  timestamp: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, Response<T> | ErrorResponse>
{
  private readonly logger = new Logger(ResponseInterceptor.name);
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        return this._handleResponse(data, context);
      }),
      catchError((err) => {
        this.logger.error(err);
        if (err instanceof HttpException) {
          return throwError(() => this._handleError(err, context));
        }
        const wrappedError = new InternalServerErrorException(
          'An unexpected error occurred',
          {
            cause: err,
          },
        );

        return throwError(() => wrappedError);
      }),
    );
  }

  _handleResponse(response: any, context: ExecutionContext): Response<T> {
    const ctx = context.switchToHttp();
    const responseCtx = ctx.getResponse();
    const statusCode = responseCtx.statusCode;
    const timestamp = new Date().toISOString();
    const message = response?.message || 'Request successful';

    return {
      success: true,
      data: response,
      message: message,
      timestamp: timestamp,
      statusCode: statusCode,
    };
  }
  _handleError(
    exception: HttpException,
    context: ExecutionContext,
  ): ErrorResponse {
    const ctx = context.switchToHttp();
    const requestURL = ctx.getRequest().url;
    const response = ctx.getResponse();
    const timestamp = new Date().toISOString();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    return response.status(status).json({
      success: false,
      statusCode: status,
      timestamp,
      message: exception.message,
      path: requestURL,
      error: {
        name: exception.name,
        details: exception.cause,
      },
    });
  }
}
