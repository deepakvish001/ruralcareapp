
DROP POLICY "Users can create queue entries" ON public.queue_entries;

CREATE POLICY "Users can create queue entries"
ON public.queue_entries FOR INSERT TO authenticated
WITH CHECK (auth.uid() = doctor_id OR doctor_id IS NULL);
