export type ProposalStatus = "draft" | "sent" | "viewed" | "approved" | "declined";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "user";
  created_at: string;
}

export interface CompanySettings {
  id: string;
  company_name: string;
  license_number: string;
  address_line1: string;
  address_line2: string;
  phone: string;
  email: string;
  logo_url: string | null;
  gemini_api_key: string | null;
  sendgrid_api_key: string | null;
  default_warranty_text: string;
  default_terms_text: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  created_at: string;
}

export interface Proposal {
  id: string;
  proposal_number: string;
  client_id: string;
  client?: Client;
  status: ProposalStatus;
  title: string;
  introduction: string;
  total_amount: number;
  warranty_text: string;
  terms_text: string;
  payment_milestones: PaymentMilestone[];
  zones: ProposalZone[];
  notes: string;
  valid_until: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  viewed_at: string | null;
  signed_at: string | null;
  signature_data: string | null;
  signer_name: string | null;
  signer_ip: string | null;
  share_token: string;
}

export interface ProposalZone {
  id: string;
  proposal_id: string;
  name: string;
  line_items: LineItem[];
  sort_order: number;
}

export interface LineItem {
  id: string;
  zone_id: string;
  description: string;
  quantity: number | null;
  unit: string;
  unit_price: number | null;
  amount: number;
  is_addon: boolean;
  sort_order: number;
}

export interface PaymentMilestone {
  id: string;
  proposal_id: string;
  description: string;
  percentage: number;
  amount: number;
  sort_order: number;
}

export interface ServiceTemplate {
  id: string;
  name: string;
  description: string;
  default_unit: string;
  default_unit_price: number | null;
  category: string;
  is_active: boolean;
}
