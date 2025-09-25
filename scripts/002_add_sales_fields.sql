-- Add price field to form_items table
ALTER TABLE form_items ADD COLUMN price DECIMAL(10,2) DEFAULT 0;

-- Add sales fields to form_responses table
ALTER TABLE form_responses ADD COLUMN customer_name VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE form_responses ADD COLUMN customer_email VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE form_responses ADD COLUMN customer_phone VARCHAR(20) NOT NULL DEFAULT '';
ALTER TABLE form_responses ADD COLUMN seller_name VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE form_responses ADD COLUMN sale_amount DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Remove the default constraints after adding the columns
ALTER TABLE form_responses ALTER COLUMN customer_name DROP DEFAULT;
ALTER TABLE form_responses ALTER COLUMN customer_email DROP DEFAULT;
ALTER TABLE form_responses ALTER COLUMN customer_phone DROP DEFAULT;
ALTER TABLE form_responses ALTER COLUMN seller_name DROP DEFAULT;
ALTER TABLE form_responses ALTER COLUMN sale_amount DROP DEFAULT;

-- Update RLS policies to include new fields
DROP POLICY IF EXISTS "Users can view their own form responses" ON form_responses;
CREATE POLICY "Users can view their own form responses" ON form_responses
  FOR SELECT USING (
    form_id IN (
      SELECT id FROM forms WHERE owner_id = auth.uid()
    )
  );

-- Allow public insert with new fields
DROP POLICY IF EXISTS "Anyone can insert form responses for public forms" ON form_responses;
CREATE POLICY "Anyone can insert form responses for public forms" ON form_responses
  FOR INSERT WITH CHECK (
    form_id IN (
      SELECT id FROM forms WHERE is_public = true AND is_active = true
    )
  );
