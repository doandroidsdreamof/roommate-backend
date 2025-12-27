import { emailSchema, refreshToken } from 'src/shared/schema';
import z from 'zod';

// TODO code duplication
// TODO hardcoded validation errors
export const otpValidationSchema = z.object({
  ...emailSchema.shape,
});

export const verifyOtpValidationSchema = z.object({
  ...emailSchema.shape,
  otp: z.string().length(6),
});

export const refreshTokenValidationSchema = z.object({
  ...refreshToken.shape,
});

export const logoutValidationSchema = z.object({
  ...refreshToken.shape,
});

export type LogoutDTO = z.infer<typeof logoutValidationSchema>;

export type RefreshTokenDTO = z.infer<typeof refreshTokenValidationSchema>;

export type VerifyOtpDTO = z.infer<typeof verifyOtpValidationSchema>;
export type OtpDTO = z.infer<typeof otpValidationSchema>;
