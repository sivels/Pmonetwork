import { getSession } from 'next-auth/react';
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

  const session = await getSession({ req });
  if (!session || session.user.role !== 'candidate') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const candidateId = session.user.id;

  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'photos');
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
        return res.status(500).json({ error: 'Upload failed' });
      }

      const photoFile = files.photo?.[0] || files.photo;
      if (!photoFile) {
        return res.status(400).json({ error: 'No photo file provided' });
      }

      const photoUrl = `/uploads/photos/${path.basename(photoFile.filepath)}`;

      // Update profile with photo URL
      await prisma.candidateProfile.update({
        where: { userId: candidateId },
        data: { profilePhotoUrl: photoUrl }
      });

      return res.status(200).json({ photoUrl });
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
