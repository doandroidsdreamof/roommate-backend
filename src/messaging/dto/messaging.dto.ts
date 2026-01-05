import z from 'zod';
import { getEnumValues } from 'src/helpers/getEnumValues';

export const MESSAGE_CONTEXT_TYPE = {
  MATCH: 'MATCH',
  POSTING: 'POSTING',
} as const;

const messageContextTypeEnum = getEnumValues(MESSAGE_CONTEXT_TYPE);
export const SendMessageSchema = z.object({
  recipientId: z.uuid('Recipient ID must be a valid UUID'),
  messageContent: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message too long (max 1000 characters)')
    .trim(),
  contextType: z.enum(messageContextTypeEnum),
});

export type SendMessageDTO = z.infer<typeof SendMessageSchema>;

export type SendMessageInput = z.infer<typeof SendMessageSchema> & {
  senderId: string; // Added by gateway from JWT
};
