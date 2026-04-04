
-- Function: notify on referral status change
CREATE OR REPLACE FUNCTION public.notify_referral_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications (user_id, title, body, type)
    VALUES (
      NEW.referring_doctor_id,
      'Referral Status Updated',
      'Referral for ' || NEW.patient_name || ' is now ' || NEW.status || ' at ' || NEW.destination_hospital,
      'referral'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_referral_status_change
AFTER UPDATE ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION public.notify_referral_status_change();

-- Function: notify on follow-up date approaching
CREATE OR REPLACE FUNCTION public.notify_followup_approaching()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  patient_name TEXT;
BEGIN
  IF NEW.follow_up_date IS NOT NULL AND NEW.recorded_by IS NOT NULL THEN
    IF NEW.follow_up_date <= (CURRENT_DATE + INTERVAL '1 day') AND NEW.follow_up_date >= CURRENT_DATE THEN
      SELECT name INTO patient_name FROM public.patients WHERE id = NEW.patient_id;
      INSERT INTO public.notifications (user_id, title, body, type)
      VALUES (
        NEW.recorded_by,
        'Follow-up Reminder',
        'Follow-up visit for ' || COALESCE(patient_name, 'a patient') || ' is due on ' || NEW.follow_up_date::text,
        'followup'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_visit_followup_set
AFTER INSERT OR UPDATE OF follow_up_date ON public.visits
FOR EACH ROW
EXECUTE FUNCTION public.notify_followup_approaching();
