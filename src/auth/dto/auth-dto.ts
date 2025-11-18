import z from 'zod';

export const otpValidationSchema = z.object({
  email: z.email({ message: 'Invalid email address' }),
  userName: z.string().optional(),
});

export type OtpValidationDTO = z.infer<typeof otpValidationSchema>;
