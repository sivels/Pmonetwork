import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { prisma } from '../../../lib/prisma';

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
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'videos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 4.5 * 1024 * 1024, // 4.5MB - Vercel has 5MB limit for serverless functions
      filename: (name, ext, part) => {
        return `${candidateId}-${Date.now()}${ext}`;
      }
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Video upload error:', err);
        if (err.code === 'LIMIT_FILE_SIZE' || err.httpCode === 413) {
          return res.status(413).json({ error: 'Video file is too large. Maximum size is 4.5MB. Please compress your video or use a shorter clip.' });
        }
        return res.status(500).json({ error: 'Upload failed' });
      }

      const videoFile = files.video?.[0] || files.video;
      if (!videoFile) {
        return res.status(400).json({ error: 'No video file provided' });
      }

      const videoUrl = `/uploads/videos/${path.basename(videoFile.filepath)}`;

      // Update profile with video URL
      await prisma.candidateProfile.update({
        where: { userId: candidateId },
        data: { videoIntroUrl: videoUrl }
      });

      return res.status(200).json({ videoUrl });
    });
  } catch (error) {
    console.error('Video upload error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
