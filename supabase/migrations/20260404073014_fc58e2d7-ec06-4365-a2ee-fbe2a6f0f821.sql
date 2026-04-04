CREATE POLICY "Doctors can delete their consultations"
ON public.consultations
FOR DELETE
TO authenticated
USING (auth.uid() = doctor_id);