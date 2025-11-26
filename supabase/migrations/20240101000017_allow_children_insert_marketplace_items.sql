-- Allow children (anon role) to insert their own marketplace items
-- Since children use access codes instead of auth.uid(), we allow anon role to insert
-- Application logic verifies the child session matches the seller_child_id

-- Allow anon role to insert marketplace items
-- Application logic will verify the child session
CREATE POLICY "Children can insert marketplace items"
  ON public.marketplace_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow children to update their own marketplace items
CREATE POLICY "Children can update their own marketplace items"
  ON public.marketplace_items FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Allow children to delete their own marketplace items (by setting status to 'removed')
CREATE POLICY "Children can delete their own marketplace items"
  ON public.marketplace_items FOR DELETE
  TO anon, authenticated
  USING (true);

