import z from 'zod';

export const otpValidationSchema = z.object({
  email: z.email({ message: 'Invalid email address' }),
});

export const verifyOtpValidationSchema = z.object({
  email: z.email({ message: 'Invalid email address' }),
  otp: z.string().length(6),
});

export type VerifyOtpDTO = z.infer<typeof verifyOtpValidationSchema>;
export type OtpDTO = z.infer<typeof otpValidationSchema>;
