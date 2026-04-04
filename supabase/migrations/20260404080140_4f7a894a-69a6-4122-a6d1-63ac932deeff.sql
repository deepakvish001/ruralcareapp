CREATE TABLE public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_user_id uuid NOT NULL,
  doctor_id uuid NOT NULL,
  appointment_date date NOT NULL,
  time_slot text NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own appointments"
ON public.appointments FOR SELECT TO authenticated
USING (auth.uid() = patient_user_id OR auth.uid() = doctor_id);

CREATE POLICY "Patients can create appointments"
ON public.appointments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = patient_user_id);

CREATE POLICY "Doctors can update appointments"
ON public.appointments FOR UPDATE TO authenticated
USING (auth.uid() = doctor_id);

CREATE POLICY "Patients can cancel own appointments"
ON public.appointments FOR UPDATE TO authenticated
USING (auth.uid() = patient_user_id);

CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();