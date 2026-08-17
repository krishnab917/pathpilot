-- Keep the authenticated discovery RPC unavailable to anonymous callers.
revoke all on function public.list_discoverable_opportunities(text, text, text, text, boolean, text[], integer, integer) from public;
grant execute on function public.list_discoverable_opportunities(text, text, text, text, boolean, text[], integer, integer) to authenticated;
