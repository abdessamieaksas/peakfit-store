CREATE OR REPLACE FUNCTION public.peakfit_require_contact_before_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.status = 'NEW' AND NEW.status = 'CONFIRMED' THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_TRANSITION';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint

CREATE TRIGGER orders_require_contact_before_confirmation
BEFORE UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.peakfit_require_contact_before_confirmation();
--> statement-breakpoint

REVOKE ALL ON FUNCTION public.peakfit_require_contact_before_confirmation() FROM PUBLIC;
