-- Supabase may grant newly created functions directly to anon by default.
revoke all on function public.list_discoverable_opportunities(text, text, text, text, boolean, text[], integer, integer) from anon;
revoke all on function public.list_discoverable_opportunities(text, text, text, text, boolean, text[], integer, integer) from public;
grant execute on function public.list_discoverable_opportunities(text, text, text, text, boolean, text[], integer, integer) to authenticated;
