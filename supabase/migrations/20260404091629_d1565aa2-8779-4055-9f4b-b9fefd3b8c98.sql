
-- Assign admin role to owner
INSERT INTO public.user_roles (user_id, role)
VALUES ('77902184-6965-47fe-aa3f-05c6d1e03dda', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Admins can view all role change requests
CREATE POLICY "Admins can view all role change requests"
  ON public.role_change_requests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update role change requests (approve/deny)
CREATE POLICY "Admins can update role change requests"
  ON public.role_change_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update any profile (to change roles)
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
