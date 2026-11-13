-- Two-way ratings: after the handover both buyer and seller can rate the other side, once each per deal.
-- Was: unique(thread_id) and buyer-only. Now: unique(thread_id, rater_id), ratee = the other party.
alter table public.ratings drop constraint if exists ratings_thread_id_key;
alter table public.ratings add constraint ratings_thread_rater_key unique (thread_id, rater_id);

create or replace function public.submit_rating(p_thread bigint, p_stars integer, p_tags text[], p_comment text)
returns void language plpgsql security definer set search_path to '' as $function$
declare t public.threads%rowtype; v_ratee uuid;
begin
  select * into t from public.threads where id = p_thread;
  if not found or auth.uid() is null or auth.uid() not in (t.buyer_id, t.seller_id) then raise exception 'Not your deal'; end if;
  if t.status <> 'completed' then raise exception 'Complete the handover first'; end if;
  if p_stars is null or p_stars not between 1 and 5 then raise exception 'Choose 1 to 5 stars'; end if;
  if coalesce(array_length(p_tags, 1), 0) > 5 then raise exception 'Too many tags'; end if;
  if exists (select 1 from public.ratings r where r.thread_id = p_thread and r.rater_id = auth.uid()) then raise exception 'You already rated this deal'; end if;
  v_ratee := case when auth.uid() = t.buyer_id then t.seller_id else t.buyer_id end;
  insert into public.ratings (thread_id, rater_id, ratee_id, stars, tags, comment)
    values (p_thread, auth.uid(), v_ratee, p_stars, coalesce(p_tags, '{}'), left(coalesce(p_comment, ''), 500));
  update public.profiles
    set rating_avg = (select round(avg(r.stars)::numeric, 1) from public.ratings r where r.ratee_id = v_ratee)
    where id = v_ratee;
end $function$;
