export type LabParameter = {
  name: string;
  value: number | string;
  unit?: string | null;
  referenceRange?: string | null;
};

export type LabReport = {
  id: string;
  title?: string | null;
  date?: string | null;
  hospital?: string | null;
  doctor?: string | null;
  parameters: LabParameter[];
  fileUrl?: string | null;
  userId?: string;
};

