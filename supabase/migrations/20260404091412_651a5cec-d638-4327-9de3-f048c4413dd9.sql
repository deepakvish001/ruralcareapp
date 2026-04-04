
CREATE TABLE public.role_change_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  from_role TEXT NOT NULL,
  to_role TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.role_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests"
  ON public.role_change_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create requests"
  ON public.role_change_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_role_change_requests_updated_at
  BEFORE UPDATE ON public.role_change_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
