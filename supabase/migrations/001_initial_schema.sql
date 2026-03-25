-- ============================================
-- 4 Seasons Greens - Proposal Management System
-- Database Schema
-- ============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- COMPANY SETTINGS (singleton)
-- ============================================
CREATE TABLE company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL DEFAULT '4 Seasons Greens, Inc.',
  license_number TEXT DEFAULT '',
  address_line1 TEXT DEFAULT '',
  address_line2 TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  logo_url TEXT,
  gemini_api_key TEXT,
  sendgrid_api_key TEXT,
  default_warranty_text TEXT DEFAULT 'We warrant all artificial turf installations for a period of 8 years from the date of completion. This warranty covers material defects and installation workmanship. Normal wear and tear, damage from misuse, and acts of nature are excluded.',
  default_terms_text TEXT DEFAULT E'1. A 50% deposit is required to schedule the installation date.\n2. Balance is due upon completion of the project.\n3. Any changes to the scope of work after signing may result in price adjustments.\n4. Client is responsible for obtaining any required HOA approvals or permits.\n5. 4 Seasons Greens is fully licensed and insured.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default company settings
INSERT INTO company_settings (company_name, license_number, address_line1, address_line2, phone, email)
VALUES (
  '4 Seasons Greens, Inc.',
  'Lic. 1089486',
  '3572 Pleasant Crest Dr',
  'San Jose, CA 95148',
  '(408) 660-0614',
  'osbaldot@4seasonsgreensinc.com'
);

-- ============================================
-- CLIENTS
-- ============================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  address_line1 TEXT DEFAULT '',
  address_line2 TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- SERVICE TEMPLATES
-- ============================================
CREATE TABLE service_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  default_unit TEXT NOT NULL DEFAULT 'each',
  default_unit_price NUMERIC(10,2),
  category TEXT NOT NULL DEFAULT 'General',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default service templates for turf installation
INSERT INTO service_templates (name, description, default_unit, category) VALUES
  ('Soil Removal', 'Soil removal 4 to 5 inches deep', 'sqft', 'Site Preparation'),
  ('Metal Edge Installation', 'Install black metal edge border', 'linear ft', 'Site Preparation'),
  ('Base Rock Grading', 'Grade area with base rock and compact', 'sqft', 'Site Preparation'),
  ('Base Fines Grading', 'Grade area with base fines and compact', 'sqft', 'Site Preparation'),
  ('Artificial Grass Installation', 'Install premium artificial grass', 'sqft', 'Turf Installation'),
  ('Putting Green Installation', 'Install putting green turf', 'sqft', 'Turf Installation'),
  ('Pet Turf Installation', 'Install pet-friendly artificial turf with drainage', 'sqft', 'Turf Installation'),
  ('Step Walkway Installation', 'Install step walkway with pavers', 'each', 'Hardscape'),
  ('Paver Installation', 'Install decorative pavers', 'sqft', 'Hardscape'),
  ('Drainage System', 'Install drainage system', 'linear ft', 'Drainage'),
  ('Weed Barrier', 'Install weed barrier fabric', 'sqft', 'Site Preparation'),
  ('Site Clean Up', 'Complete site cleanup and debris removal', 'job', 'Cleanup'),
  ('Infill Application', 'Apply antimicrobial infill', 'sqft', 'Turf Installation'),
  ('Seam Work', 'Seam joining and finishing', 'linear ft', 'Turf Installation');

-- ============================================
-- PROPOSALS
-- ============================================
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_number TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'approved', 'declined')),
  title TEXT NOT NULL DEFAULT 'Artificial Grass Installation',
  introduction TEXT DEFAULT '',
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  warranty_text TEXT DEFAULT '',
  terms_text TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  valid_until DATE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  signature_data TEXT,
  signer_name TEXT,
  signer_ip TEXT,
  share_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex')
);

-- ============================================
-- PROPOSAL ZONES (areas of work)
-- ============================================
CREATE TABLE proposal_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Area 1',
  sort_order INT NOT NULL DEFAULT 0
);

-- ============================================
-- LINE ITEMS
-- ============================================
CREATE TABLE line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id UUID NOT NULL REFERENCES proposal_zones(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2),
  unit TEXT DEFAULT '',
  unit_price NUMERIC(10,2),
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_addon BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0
);

-- ============================================
-- PAYMENT MILESTONES
-- ============================================
CREATE TABLE payment_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0
);

-- ============================================
-- PROPOSAL SEQUENCE NUMBER
-- ============================================
CREATE SEQUENCE proposal_number_seq START WITH 1001;

CREATE OR REPLACE FUNCTION generate_proposal_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.proposal_number IS NULL OR NEW.proposal_number = '' THEN
    NEW.proposal_number := 'PRO-' || LPAD(nextval('proposal_number_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_proposal_number
  BEFORE INSERT ON proposals
  FOR EACH ROW EXECUTE FUNCTION generate_proposal_number();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_milestones ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Company settings: all authenticated can read, admin can update
CREATE POLICY "Authenticated can read settings" ON company_settings FOR SELECT USING (TRUE);
CREATE POLICY "Admin can update settings" ON company_settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Clients: all authenticated
CREATE POLICY "Authenticated can manage clients" ON clients FOR ALL USING (auth.uid() IS NOT NULL);

-- Service templates: all read, admin manage
CREATE POLICY "All can read templates" ON service_templates FOR SELECT USING (TRUE);
CREATE POLICY "Admin can manage templates" ON service_templates FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Proposals: all authenticated can CRUD
CREATE POLICY "Authenticated can manage proposals" ON proposals FOR ALL USING (auth.uid() IS NOT NULL);

-- Zones: follow proposal access
CREATE POLICY "Authenticated can manage zones" ON proposal_zones FOR ALL USING (auth.uid() IS NOT NULL);

-- Line items: follow zone access
CREATE POLICY "Authenticated can manage line items" ON line_items FOR ALL USING (auth.uid() IS NOT NULL);

-- Payment milestones: follow proposal access
CREATE POLICY "Authenticated can manage milestones" ON payment_milestones FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================
-- PUBLIC ACCESS for proposal viewing (share link)
-- ============================================
CREATE POLICY "Public can view shared proposals" ON proposals
  FOR SELECT USING (TRUE);

CREATE POLICY "Public can update proposal signature" ON proposals
  FOR UPDATE USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Public can view proposal zones" ON proposal_zones
  FOR SELECT USING (TRUE);

CREATE POLICY "Public can view line items" ON line_items
  FOR SELECT USING (TRUE);

CREATE POLICY "Public can view milestones" ON payment_milestones
  FOR SELECT USING (TRUE);

CREATE POLICY "Public can read company settings" ON company_settings
  FOR SELECT USING (TRUE);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_company_settings_updated_at BEFORE UPDATE ON company_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
