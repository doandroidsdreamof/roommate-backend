import { z } from 'zod';
import { getEnumValues } from 'src/helpers/getEnumValues';
import { SWIPE_ACTIONS } from 'src/constants/enums';

const swipeActions = getEnumValues(SWIPE_ACTIONS);
export const createSwipeSchema = z.object({
  swipedId: z.uuid(),
  action: z.enum(swipeActions),
});

export type CreateSwipeDto = z.infer<typeof createSwipeSchema>;
