-- Ortak Birikim Defteri — Supabase kurulumu
-- Supabase panelinde: SQL Editor → New query → bu dosyanın tamamını yapıştır → Run

-- Tek tablo: her ortak defter bir satır.
create table if not exists public.books (
  code       text primary key,
  state      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Satır güvenliği açık ve BİLEREK hiç policy yazılmıyor.
-- Yani publishable key ile tabloya doğrudan erişilemez; ne okunur ne yazılır.
-- Erişim yalnızca aşağıdaki iki fonksiyon üzerinden, defter kodunu bilerek olur.
alter table public.books enable row level security;

-- Defteri oku.
create or replace function public.book_read(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(btrim(p_code));
  v_state jsonb;
begin
  if v_code !~ '^[A-Z0-9]{8,24}$' then
    raise exception 'invalid code';
  end if;

  select state into v_state from public.books where code = v_code;
  return v_state;
end;
$$;

-- Defteri yaz. Yoksa oluşturur.
create or replace function public.book_write(p_code text, p_state jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(btrim(p_code));
  v_state jsonb;
begin
  if v_code !~ '^[A-Z0-9]{8,24}$' then
    raise exception 'invalid code';
  end if;

  -- Kötüye kullanıma karşı basit bir boyut sınırı (yaklaşık 1 MB).
  if pg_column_size(p_state) > 1000000 then
    raise exception 'state too large';
  end if;

  insert into public.books (code, state, updated_at)
  values (v_code, p_state, now())
  on conflict (code) do update
    set state = excluded.state,
        updated_at = now()
  returning state into v_state;

  return v_state;
end;
$$;

-- Fonksiyonları tarayıcıdaki uygulamaya aç.
revoke all on function public.book_read(text) from public;
revoke all on function public.book_write(text, jsonb) from public;
grant execute on function public.book_read(text) to anon;
grant execute on function public.book_write(text, jsonb) to anon;
