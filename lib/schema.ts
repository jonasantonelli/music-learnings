import { z } from "zod";

export const frontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  tags: z.array(z.string()).default([]),
  order: z.number().int().default(999),
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;
