# Supabase Storage Setup for Video Uploads

## Steps to Enable Video Uploads:

### 1. Create Storage Bucket in Supabase

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/bzlqtsrzfyghyqxklkwc
2. Click **Storage** in the left sidebar
3. Click **New Bucket**
4. Name: `videos`
5. Set as **Public** bucket (or Private if you want controlled access)
6. Click **Create Bucket**

### 2. Set Up Storage Policies

Add these policies in Storage > Policies for the `videos` bucket:

**Allow authenticated users to upload (INSERT):**
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'videos');
```

**Allow anyone to upload (if using anon key from client):**
```sql
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'videos');
```

**Allow public read access:**
```sql
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'videos');
```

**Allow users to update their own videos:**
```sql
CREATE POLICY "Allow users to update own videos"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'videos');
```

**Allow users to delete videos:**
```sql
CREATE POLICY "Allow users to delete videos"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'videos');
```

### 3. Add Environment Variables to Vercel

In Vercel Dashboard → Settings → Environment Variables, verify these exist:

- `NEXT_PUBLIC_SUPABASE_URL` = `https://bzlqtsrzfyghyqxklkwc.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (from Supabase API settings)

Note: `SUPABASE_SERVICE_ROLE_KEY` is no longer needed for client-side uploads.

### 4. Redeploy

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
