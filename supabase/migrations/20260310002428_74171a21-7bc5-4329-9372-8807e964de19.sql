
-- Create missing calc_delivery_time function
CREATE OR REPLACE FUNCTION calc_delivery_time(
  p_recipient_type text,
  p_recipient_id text,
  p_severity text
)
RETURNS timestamptz
LANGUAGE sql
STABLE
AS $$
  SELECT now() + interval '1 hour';
$$;
