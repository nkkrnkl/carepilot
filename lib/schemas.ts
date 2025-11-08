/**
 * Zod schemas for lab data validation
 */

import { z } from "zod";

export const LabExtract = z.object({
  title: z.string().optional(),
  date: z.string().optional(),
  hospital: z.string().optional().nullable(),
  doctor: z.string().optional().nullable(),
  parameters: z.array(
    z.object({
      name: z.string(),
      value: z.union([z.number(), z.string()]),
      unit: z.string().optional().nullable(),
      referenceRange: z.string().optional().nullable(),
    })
  ),
});

export type LabExtract = z.infer<typeof LabExtract>;

