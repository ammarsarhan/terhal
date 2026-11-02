import { z } from "zod";

// Every list response is an object, never a bare array, so fields can be added later without breaking clients.
// `nextCursor` is the last item's id when there's another page: pass it back as `cursor` to get that page.
export const page = <Item extends z.ZodType>(item: Item) =>
  z.object({ data: z.array(item), nextCursor: z.string().nullable() });
