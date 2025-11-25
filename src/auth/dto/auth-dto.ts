import z from 'zod';

// TODO code duplication
// TODO hardcoded validation errors
export const otpValidationSchema = z.object({
  email: z.email({ message: 'Invalid email address' }),
});

export const verifyOtpValidationSchema = z.object({
  email: z.email({ message: 'Invalid email address' }),
  otp: z.string().length(6),
});

export const refreshTokenValidationSchema = z.object({
  refreshToken: z.string().min(5), //TODO move it to config
  userId: z.string(),
  email: z.email({ message: 'Invalid email address' }),
});

export const logoutValidationSchema = z.object({
  refreshToken: z.string().min(5), //TODO move it to config
  userId: z.string(),
});

export type LogoutDTO = z.infer<typeof logoutValidationSchema>;

export type RefreshTokenDTO = z.infer<typeof refreshTokenValidationSchema>;

export type VerifyOtpDTO = z.infer<typeof verifyOtpValidationSchema>;
export type OtpDTO = z.infer<typeof otpValidationSchema>;
