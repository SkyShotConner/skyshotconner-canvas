-- SkyShotConner photography gallery
-- Original uploads are preserved; a WebP display derivative is generated for the public masonry gallery.

create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  original_path text not null unique,
  display_path text not null unique,
  alt_text text not null default '',
  width integer,
  height integer,
  is_published boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gallery_images_public_order_idx
  on public.gallery_images (is_published, display_order, created_at desc);

create table if not exists public.gallery_image_notes (
  image_id uuid primary key references public.gallery_images(id) on delete cascade,
  private_note text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.gallery_images enable row level security;
alter table public.gallery_image_notes enable row level security;

revoke all on public.gallery_images from anon, authenticated;
grant select on public.gallery_images to anon, authenticated;
grant insert, update, delete on public.gallery_images to authenticated;

revoke all on public.gallery_image_notes from anon, authenticated;
grant select, insert, update, delete on public.gallery_image_notes to authenticated;

drop policy if exists "Public can view published gallery images" on public.gallery_images;
create policy "Public can view published gallery images"
  on public.gallery_images for select to anon, authenticated
  using (is_published = true);

drop policy if exists "Admins manage gallery images" on public.gallery_images;
create policy "Admins manage gallery images"
  on public.gallery_images for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admins manage private gallery notes" on public.gallery_image_notes;
create policy "Admins manage private gallery notes"
  on public.gallery_image_notes for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Private bucket: only administrators can upload/manage objects. Visitors can receive
-- signed URLs only for the original/display objects belonging to published gallery rows.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gallery-images', 'gallery-images', false, 20971520, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Gallery objects readable when published or by admins" on storage.objects;
create policy "Gallery objects readable when published or by admins"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'gallery-images'
    and (
      (select public.is_admin())
      or exists (
        select 1
        from public.gallery_images gi
        where gi.is_published = true
          and (gi.original_path = name or gi.display_path = name)
      )
    )
  );

drop policy if exists "Admins can upload gallery objects" on storage.objects;
create policy "Admins can upload gallery objects"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'gallery-images' and (select public.is_admin()));

drop policy if exists "Admins can update gallery objects" on storage.objects;
create policy "Admins can update gallery objects"
  on storage.objects for update to authenticated
  using (bucket_id = 'gallery-images' and (select public.is_admin()))
  with check (bucket_id = 'gallery-images' and (select public.is_admin()));

drop policy if exists "Admins can delete gallery objects" on storage.objects;
create policy "Admins can delete gallery objects"
  on storage.objects for delete to authenticated
  using (bucket_id = 'gallery-images' and (select public.is_admin()));
