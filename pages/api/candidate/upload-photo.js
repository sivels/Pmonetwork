import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { prisma } from '../../../lib/prisma';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || (session.user.role || '').toLowerCase() !== 'candidate') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { candidateCandidateProfile: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const candidateId = user.id;
    const profile = user.candidateCandidateProfile;

    // Create profile if it doesn't exist
    if (!profile) {
      await prisma.candidateProfile.create({
        data: { userId: candidateId }
      });
    }

    // Use /tmp directory for Vercel serverless
    const uploadDir = path.join('/tmp', 'uploads', 'photos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      filename: (name, ext, part) => {
        return `${candidateId}-${Date.now()}${ext}`;
      }
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Photo upload error:', err);
        return res.status(500).json({ error: 'Upload failed', details: err.message });
      }

      const photoFile = files.photo?.[0] || files.photo;
      if (!photoFile) {
        return res.status(400).json({ error: 'No photo file provided' });
      }

      // Read file and convert to base64 for storage (since Vercel is serverless)
      const fileBuffer = fs.readFileSync(photoFile.filepath);
      const base64Data = fileBuffer.toString('base64');
      const mimeType = photoFile.mimetype || 'image/jpeg';
      const dataUrl = `data:${mimeType};base64,${base64Data}`;

      // Clean up temp file
      fs.unlinkSync(photoFile.filepath);

      // Update profile with base64 data URL
      await prisma.candidateProfile.update({
        where: { userId: candidateId },
        data: { profilePhotoUrl: dataUrl }
      });

      return res.status(200).json({ photoUrl: dataUrl });
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
