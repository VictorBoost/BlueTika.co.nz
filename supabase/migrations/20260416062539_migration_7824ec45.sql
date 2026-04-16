-- Drop the incorrect admin policy and create a simpler one
-- Admin access will be controlled at the application level
DROP POLICY IF EXISTS "admin_read_references" ON provider_references;

-- Create policy that allows providers to see their own references
-- and clients to see references for their paid contracts
CREATE POLICY "providers_and_clients_read_references" ON provider_references
FOR SELECT USING (
  auth.uid() = provider_id
  OR
  EXISTS (
    SELECT 1 FROM contracts c
    WHERE c.provider_id = provider_references.provider_id
    AND c.client_id = auth.uid()
    AND c.payment_status = 'paid'
  )
);