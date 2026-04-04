CREATE POLICY "Patients can update their consultations"
ON public.consultations
FOR UPDATE
TO authenticated
USING (auth.uid() = patient_user_id);