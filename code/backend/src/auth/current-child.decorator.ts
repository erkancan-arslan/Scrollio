import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentChild = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['x-child-profile-id'] as string | undefined;
  },
);
