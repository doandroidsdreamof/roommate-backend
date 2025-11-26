import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../auth.guard';
import { Request } from 'express';

export const AuthUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request?.user as JwtPayload;

    return data ? user?.[data] : user;
  },
);
