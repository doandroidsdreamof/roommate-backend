import { HttpStatus } from '@nestjs/common';

export const ERRORS = {
  // ============= AUTH (1xxx) =============
  INVALID_OTP: {
    code: 'AUTH_1000',
    message: 'Invalid OTP code',
    status: HttpStatus.UNAUTHORIZED,
  },
  MAX_OTP_ATTEMPTS: {
    code: 'AUTH_1001',
    message: 'Maximum OTP attempts reached',
    status: HttpStatus.UNAUTHORIZED,
  },
  INVALID_REFRESH_TOKEN: {
    code: 'AUTH_1002',
    message: 'Invalid or expired refresh token',
    status: HttpStatus.UNAUTHORIZED,
  },
  LOGOUT_FAILED: {
    code: 'AUTH_1003',
    message: 'Logout failed',
    status: HttpStatus.UNAUTHORIZED,
  },
  EXPIRED_OTP: {
    code: 'AUTH_1004',
    message: 'Expired OTP code',
    status: HttpStatus.UNAUTHORIZED,
  },

  // ============= USER (2xxx) =============
  USER_NOT_FOUND: {
    code: 'USER_2000',
    message: 'User not found',
    status: HttpStatus.NOT_FOUND,
  },
  PROFILE_NOT_FOUND: {
    code: 'USER_2001',
    message: 'Profile not found',
    status: HttpStatus.NOT_FOUND,
  },
  PROFILE_ALREADY_EXISTS: {
    code: 'USER_2002',
    message: 'Profile already exists for this user',
    status: HttpStatus.CONFLICT,
  },
  PREFERENCES_NOT_FOUND: {
    code: 'USER_2003',
    message: 'Preferences not found',
    status: HttpStatus.NOT_FOUND,
  },
  PREFERENCES_ALREADY_EXIST: {
    code: 'USER_2004',
    message: 'Preferences already exist for this user',
    status: HttpStatus.CONFLICT,
  },

  // ============= POSTING (3xxx) =============
  POSTING_NOT_FOUND: {
    code: 'POSTING_3000',
    message: 'Posting not found',
    status: HttpStatus.NOT_FOUND,
  },
  DUPLICATE_POSTING: {
    code: 'POSTING_3001',
    message: 'You already have an active posting in this neighborhood',
    status: HttpStatus.CONFLICT,
  },
  POSTING_ALREADY_CLOSED: {
    code: 'POSTING_3002',
    message: 'Posting is already closed',
    status: HttpStatus.CONFLICT,
  },
  POSTING_CREATION_FAILED: {
    code: 'POSTING_3003',
    message: 'Failed to create posting',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  POSTING_UPDATE_FAILED: {
    code: 'POSTING_3004',
    message: 'Failed to update posting',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  POSTING_IMAGE_NOT_FOUND: {
    code: 'POSTING_3005',
    message: 'Posting image not found',
    status: HttpStatus.NOT_FOUND,
  },
  POSTING_SPEC_CREATION_FAILED: {
    code: 'POSTING_3006',
    message: 'Failed to create posting_spec',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },

  MAX_POSTINGS_REACHED: {
    code: 'POSTING_3007',
    message: 'You have reached the maximum limit of 5 active postings',
    status: HttpStatus.FORBIDDEN,
  },

  // ============= BOOKMARK (4xxx) =============
  BOOKMARK_ALREADY_EXISTS: {
    code: 'BOOKMARK_4000',
    message: 'Posting already bookmarked',
    status: HttpStatus.CONFLICT,
  },
  BOOKMARK_NOT_FOUND: {
    code: 'BOOKMARK_4001',
    message: 'Bookmark not found',
    status: HttpStatus.NOT_FOUND,
  },
  BOOKMARK_FAILED: {
    code: 'BOOKMARK_4002',
    message: 'Failed to bookmark posting',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },

  // ============= BLOCK (5xxx) =============
  CANNOT_BLOCK_SELF: {
    code: 'BLOCK_5000',
    message: 'Cannot block yourself',
    status: HttpStatus.BAD_REQUEST,
  },
  BLOCK_ALREADY_EXISTS: {
    code: 'BLOCK_5001',
    message: 'User is already blocked',
    status: HttpStatus.CONFLICT,
  },
  BLOCK_NOT_FOUND: {
    code: 'BLOCK_5002',
    message: 'Block not found',
    status: HttpStatus.NOT_FOUND,
  },
  BLOCKED_USER_INTERACTION: {
    code: 'BLOCK_5003',
    message: 'Cannot interact with blocked user',
    status: HttpStatus.FORBIDDEN,
  },

  // ============= SWIPE/MATCH (6xxx) =============
  CANNOT_SWIPE_SELF: {
    code: 'SWIPE_6000',
    message: 'Cannot swipe on yourself',
    status: HttpStatus.BAD_REQUEST,
  },
  SWIPE_TARGET_NOT_FOUND: {
    code: 'SWIPE_6001',
    message: 'User not found',
    status: HttpStatus.NOT_FOUND,
  },
  SWIPE_FAILED: {
    code: 'SWIPE_6002',
    message: 'Failed to process swipe',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  MATCH_NOT_FOUND: {
    code: 'MATCH_6003',
    message: 'Match not found or already unmatched',
    status: HttpStatus.NOT_FOUND,
  },
  MATCH_CREATION_FAILED: {
    code: 'MATCH_6004',
    message: 'Failed to create match',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  UNMATCH_FAILED: {
    code: 'MATCH_6005',
    message: 'Failed to unmatch',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },

  // ============= PERMISSION (7xxx) =============
  FORBIDDEN: {
    code: 'PERMISSION_7000',
    message: 'You do not have permission to access this resource',
    status: HttpStatus.FORBIDDEN,
  },
  RESOURCE_OWNERSHIP_REQUIRED: {
    code: 'PERMISSION_7001',
    message: 'You must own this resource to perform this action',
    status: HttpStatus.FORBIDDEN,
  },

  // ============= VALIDATION (8xxx) =============
  VALIDATION_FAILED: {
    code: 'VALIDATION_8000',
    message: 'Validation failed',
    status: HttpStatus.BAD_REQUEST,
  },

  // ============= SERVER (9xxx) =============
  INTERNAL_SERVER_ERROR: {
    code: 'SERVER_9000',
    message: 'Internal server error',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  DATABASE_ERROR: {
    code: 'SERVER_9001',
    message: 'Database operation failed',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },

  // ============= MESSAGING (10xxx) =============
  MESSAGE_UNAUTHORIZED: {
    code: 'MESSAGE_10000',
    message: 'You are not authorized to message this user',
    status: HttpStatus.FORBIDDEN,
  },
  MATCH_REQUIRED: {
    code: 'MESSAGE_10001',
    message: 'You must be matched with this user to send messages',
    status: HttpStatus.FORBIDDEN,
  },
  POSTING_NOT_FOUND_FOR_MESSAGING: {
    code: 'MESSAGE_10003',
    message: 'Posting not found or no longer active',
    status: HttpStatus.NOT_FOUND,
  },
  POSTING_OWNER_REQUIRED: {
    code: 'MESSAGE_10004',
    message: 'Recipient must be the posting owner',
    status: HttpStatus.FORBIDDEN,
  },
  CANNOT_MESSAGE_SELF: {
    code: 'MESSAGE_10005',
    message: 'Cannot send messages to yourself',
    status: HttpStatus.BAD_REQUEST,
  },
  MESSAGE_CONTENT_INVALID: {
    code: 'MESSAGE_10006',
    message: 'Message content is invalid or too long',
    status: HttpStatus.BAD_REQUEST,
  },
  MESSAGE_SEND_FAILED: {
    code: 'MESSAGE_10007',
    message: 'Failed to send message',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  CONVERSATION_NOT_FOUND: {
    code: 'MESSAGE_10008',
    message: 'Conversation not found',
    status: HttpStatus.NOT_FOUND,
  },
  CONVERSATION_CREATION_FAILED: {
    code: 'MESSAGE_10009',
    message: 'Failed to create conversation',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  MESSAGE_RATE_LIMIT_EXCEEDED: {
    code: 'MESSAGE_10011',
    message: 'Message rate limit exceeded. Please slow down.',
    status: HttpStatus.TOO_MANY_REQUESTS,
  },
  BLOCKED_USER_MESSAGE: {
    code: 'MESSAGE_10012',
    message: 'Cannot send messages to a blocked user',
    status: HttpStatus.FORBIDDEN,
  },
} as const;

export type ErrorKey = keyof typeof ERRORS;
