
-- Create doctors table
CREATE TABLE public.doctors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  facility_type TEXT NOT NULL DEFAULT 'PHC',
  location TEXT,
  phone TEXT,
  available BOOLEAN NOT NULL DEFAULT true,
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view doctors" ON public.doctors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Doctors can update own record" ON public.doctors FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Doctors can insert own record" ON public.doctors FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON public.doctors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial doctor data
INSERT INTO public.doctors (name, specialty, facility_type, location, phone, available) VALUES
  ('Dr. Priya Sharma', 'General Medicine', 'PHC', '2.5 km', '+91 98765 00001', true),
  ('Dr. Rajesh Kumar', 'Pediatrics', 'District Hospital', '8 km', '+91 98765 00002', true),
  ('Dr. Anita Desai', 'OB/GYN', 'Private Clinic', '5 km', '+91 98765 00003', false),
  ('Dr. Suresh Reddy', 'Orthopedics', 'District Hospital', '8 km', '+91 98765 00004', true),
  ('Dr. Meena Patel', 'Dermatology', 'Private Clinic', '12 km', '+91 98765 00005', true),
  ('Dr. Arun Singh', 'ENT', 'PHC', '3 km', '+91 98765 00006', false);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  type TEXT NOT NULL DEFAULT 'info',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
