import { ForbiddenException } from '@nestjs/common';

export const validateOwnership = (
  resourceOwnerId: string,
  currentUserId: string,
  resourceName: string = 'resource',
): void => {
  if (resourceOwnerId !== currentUserId) {
    throw new ForbiddenException(`Failed permission: ${resourceName}`);
  }
};
