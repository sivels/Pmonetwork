# Supabase Storage Setup for Video Uploads

## Steps to Enable Video Uploads:

### 1. Create Storage Bucket in Supabase

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/bzlqtsrzfyghyqxklkwc
2. Click **Storage** in the left sidebar
3. Click **New Bucket**
4. Name: `videos`
5. Set as **Public** bucket (or Private if you want controlled access)
6. Click **Create Bucket**

### 2. Set Up Storage Policies (if using Private bucket)

If you made the bucket private, add these policies in Storage > Policies:

**Allow authenticated users to upload:**
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'videos');
```

**Allow public read access:**
```sql
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'videos');
```

**Allow users to delete their own videos:**
```sql
CREATE POLICY "Allow users to delete own videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### 3. Get Supabase Service Role Key

1. Go to **Project Settings** → **API**
2. Copy the `service_role` key (⚠️ Keep this secret!)
3. Add to Vercel environment variables as `SUPABASE_SERVICE_ROLE_KEY`

### 4. Add Environment Variables to Vercel

In Vercel Dashboard → Settings → Environment Variables, add:

- `NEXT_PUBLIC_SUPABASE_URL` = `https://bzlqtsrzfyghyqxklkwc.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (from Supabase API settings)
- `SUPABASE_SERVICE_ROLE_KEY` = (from Supabase API settings - service_role key)

### 5. Redeploy

After adding environment variables, redeploy your application.

## Benefits:

✅ No AWS account needed
✅ 1GB free storage (upgradable)
✅ 100MB per file limit (vs 5MB on Vercel)
✅ CDN delivery included
✅ Already integrated with your database
✅ Simple API
✅ Automatic video optimization available

## Costs:

- Free tier: 1GB storage
- Pro plan ($25/month): 100GB storage
- Additional storage: $0.021/GB/month
- No egress fees on Pro plan

## Storage URL Format:

Videos will be accessible at:
`https://bzlqtsrzfyghyqxklkwc.supabase.co/storage/v1/object/public/videos/{candidateId}/{timestamp}.mp4`
