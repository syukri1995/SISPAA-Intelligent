export type ComplaintCreate = {
  complaint_text: string;
  location_text?: string | null;
  image_url?: string | null;
  email?: string | null;
};

export type ComplaintStatus = {
  complaint_id: string;
  status: string;
  current_step?: string | null;
  category?: string | null;
  agency?: string | null;
  confidence?: number | null;
  work_order_id?: string | null;
  priority?: string | null;
  citizen_email_preview?: string | null;
  email?: string | null;
  complaint_text?: string | null;
  location_text?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

