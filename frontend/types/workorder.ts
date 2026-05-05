export type WorkOrder = {
  id: string;
  agency: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: string;
  description: string;
};

