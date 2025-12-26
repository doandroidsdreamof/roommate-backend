import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import {
  Response as ExpressResponse,
  Request as ExpressRequest,
} from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  meta?: PaginationMeta;
  timestamp: string;
};

export type ErrorResponse = {
  success: boolean;
  statusCode: number;
  message: string;
  error: {
    name: string;
    details?: unknown;
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

type ServiceResponse = {
  message?: string;
  [key: string]: unknown;
};

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T> | ErrorResponse
> {
  private readonly logger = new Logger(ResponseInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T> | ErrorResponse> {
    return next.handle().pipe(
      map((res) => this._handleResponse(res as ServiceResponse, context)),
      catchError((err: unknown) => {
        this.logger.error(err);
        if (err instanceof HttpException) {
          return throwError(() => this._handleError(err, context));
        }
        const wrappedError = new InternalServerErrorException(
          'An unexpected error occurred',
          { cause: err },
        );
        return throwError(() => wrappedError);
      }),
    );
  }

  _handleResponse(
    response: ServiceResponse | null,
    context: ExecutionContext,
  ): ApiResponse<T> {
    const ctx = context.switchToHttp();
    const res = ctx.getResponse<ExpressResponse>();
    const statusCode = res.statusCode;
    const timestamp = new Date().toISOString();
    const message = response?.message ?? 'Request successful';

    return {
      success: true,
      data: response as T,
      message,
      timestamp,
      statusCode,
    };
  }

  _handleError(exception: HttpException, context: ExecutionContext): void {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<ExpressRequest>();
    const res = ctx.getResponse<ExpressResponse>();
    const timestamp = new Date().toISOString();
    const status = exception.getStatus();

    res.status(status).json({
      success: false,
      statusCode: status,
      timestamp,
      message: exception.message,
      path: req.url,
      error: {
        name: exception.name,
        details: exception.cause,
      },
    });
  }
}
