import { z } from 'zod';
import { getEnumValues } from 'src/helpers/getEnumValues';
import { SWIPE_ACTIONS } from 'src/constants/enums';

const swipeActions = getEnumValues(SWIPE_ACTIONS);
export const createSwipeSchema = z.object({
  action: z.enum(swipeActions),
  swipedId: z.uuid(),
});

export type CreateSwipeDto = z.infer<typeof createSwipeSchema>;
