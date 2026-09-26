-- ============================================================================
-- Run this ONCE after Ester and Kypher have both signed up in the app.
-- It creates their shared couple row and links both profiles to it.
-- Replace the two email addresses and the relationship start date below.
-- ============================================================================

do $$
declare
  v_ester_id uuid;
  v_kypher_id uuid;
  v_couple_id uuid;
begin
  select id into v_ester_id from public.profiles where email = 'ester@example.com';
  select id into v_kypher_id from public.profiles where email = 'kypher@example.com';

  if v_ester_id is null or v_kypher_id is null then
    raise exception 'Both partners must sign up in the app before running this script.';
  end if;

  insert into public.couples (partner_one_id, partner_two_id, relationship_start_date, anniversary_date, quote)
  values (v_ester_id, v_kypher_id, '2023-06-14', '2023-06-14', 'Our story, our memories, our space.')
  returning id into v_couple_id;

  update public.profiles set couple_id = v_couple_id where id in (v_ester_id, v_kypher_id);
end $$;
