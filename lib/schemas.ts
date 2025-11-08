import { z } from "zod";

export const LabParameter = z.object({
  name: z.string(),
  value: z.union([z.string(), z.number()]),
  unit: z.string().nullable().optional(),
  referenceRange: z.string().nullable().optional(),
});

export const LabExtract = z.object({
  hospital: z.string().nullable(),
  doctor: z.string().nullable(),
  date: z.string().nullable(), // store as ISO later
  title: z.string().nullable().optional(),
  parameters: z.array(LabParameter),
});

export type LabParameter = z.infer<typeof LabParameter>;
export type LabExtract = z.infer<typeof LabExtract>;

