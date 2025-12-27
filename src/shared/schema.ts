import z from 'zod';

export const emailSchema = z.object({
  email: z.email({ message: 'Invalid email address' }),
});

export const refreshToken = z.object({
  refreshToken: z.string().min(5), //TODO move it to config
});
