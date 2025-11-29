import z from 'zod';

export const blockUserSchema = z.object({
  blockedId: z.uuid(),
});

export type BlockUserDto = z.infer<typeof blockUserSchema>;
