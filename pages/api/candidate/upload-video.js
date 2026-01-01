import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import formidable from 'formidable';
import fs from 'fs';
import { prisma } from '../../../lib/prisma';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user.role || '').toLowerCase() !== 'candidate') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });
  const candidateId = user.id;

  try {
    const form = formidable({
      maxFileSize: 100 * 1024 * 1024, // 100MB - Supabase Storage can handle this
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Video upload error:', err);
        if (err.code === 'LIMIT_FILE_SIZE' || err.httpCode === 413) {
          return res.status(413).json({ error: 'Video file is too large. Maximum size is 100MB.' });
        }
        return res.status(500).json({ error: 'Upload failed' });
      }

      const videoFile = files.video?.[0] || files.video;
      if (!videoFile) {
        return res.status(400).json({ error: 'No video file provided' });
      }

      // Read file buffer
      const fileBuffer = fs.readFileSync(videoFile.filepath);
      const fileExt = videoFile.originalFilename?.split('.').pop() || 'mp4';
      const fileName = `${candidateId}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabaseAdmin.storage
        .from('videos')
        .upload(fileName, fileBuffer, {
          contentType: videoFile.mimetype,
          upsert: false
        });

      // Clean up temp file
      fs.unlinkSync(videoFile.filepath);

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload to storage' });
      }

      // Get public URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('videos')
        .getPublicUrl(fileName);

      // Update profile with video URL
      await prisma.candidateProfile.update({
        where: { userId: candidateId },
        data: { videoIntroUrl: publicUrl }
      });

      return res.status(200).json({ videoUrl: publicUrl });
    });
  } catch (error) {
    console.error('Video upload error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
