
-- Create role enum for user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles without recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  village TEXT,
  role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'healthWorker', 'doctor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  village TEXT,
  phone TEXT,
  conditions TEXT[] DEFAULT '{}',
  registered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view patients"
ON public.patients FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can register patients"
ON public.patients FOR INSERT TO authenticated WITH CHECK (auth.uid() = registered_by);

CREATE POLICY "Users can update patients they registered"
ON public.patients FOR UPDATE TO authenticated USING (auth.uid() = registered_by);

CREATE POLICY "Users can delete patients they registered"
ON public.patients FOR DELETE TO authenticated USING (auth.uid() = registered_by);

-- Visits table
CREATE TABLE public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  type TEXT NOT NULL DEFAULT 'routine' CHECK (type IN ('routine', 'followup', 'emergency', 'vaccination', 'pregnancy')),
  notes TEXT,
  weight NUMERIC,
  temperature NUMERIC,
  blood_pressure TEXT,
  follow_up_date DATE,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view visits"
ON public.visits FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create visits"
ON public.visits FOR INSERT TO authenticated WITH CHECK (auth.uid() = recorded_by);

CREATE POLICY "Users can update their visits"
ON public.visits FOR UPDATE TO authenticated USING (auth.uid() = recorded_by);

-- Consultations table
CREATE TABLE public.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can view their consultations"
ON public.consultations FOR SELECT TO authenticated
USING (auth.uid() = doctor_id OR auth.uid() = patient_user_id);

CREATE POLICY "Doctors can create consultations"
ON public.consultations FOR INSERT TO authenticated WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update their consultations"
ON public.consultations FOR UPDATE TO authenticated USING (auth.uid() = doctor_id);

-- Referrals table
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  referring_doctor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  destination_hospital TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view referrals"
ON public.referrals FOR SELECT TO authenticated USING (true);

CREATE POLICY "Doctors can create referrals"
ON public.referrals FOR INSERT TO authenticated WITH CHECK (auth.uid() = referring_doctor_id);

CREATE POLICY "Doctors can update their referrals"
ON public.referrals FOR UPDATE TO authenticated USING (auth.uid() = referring_doctor_id);

-- Queue entries table
CREATE TABLE public.queue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name TEXT NOT NULL,
  patient_age INTEGER,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  symptoms TEXT,
  priority TEXT NOT NULL DEFAULT 'low' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed')),
  wait_time TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view queue"
ON public.queue_entries FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create queue entries"
ON public.queue_entries FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Doctors can update queue entries"
ON public.queue_entries FOR UPDATE TO authenticated USING (auth.uid() = doctor_id OR doctor_id IS NULL);

CREATE POLICY "Doctors can delete queue entries"
ON public.queue_entries FOR DELETE TO authenticated USING (auth.uid() = doctor_id OR doctor_id IS NULL);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON public.consultations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_patients_registered_by ON public.patients(registered_by);
CREATE INDEX idx_visits_patient_id ON public.visits(patient_id);
CREATE INDEX idx_visits_recorded_by ON public.visits(recorded_by);
CREATE INDEX idx_consultations_doctor_id ON public.consultations(doctor_id);
CREATE INDEX idx_referrals_doctor_id ON public.referrals(referring_doctor_id);
CREATE INDEX idx_queue_doctor_id ON public.queue_entries(doctor_id);
CREATE INDEX idx_queue_status ON public.queue_entries(status);
