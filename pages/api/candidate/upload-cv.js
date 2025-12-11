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
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'cvs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filename: (name, ext, part) => {
        return `cv-${candidateId}-${Date.now()}${ext}`;
      }
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('CV upload error:', err);
        return res.status(500).json({ error: 'Upload failed' });
      }

      const cvFile = files.cv?.[0] || files.cv;
      if (!cvFile) {
        return res.status(400).json({ error: 'No CV file provided' });
      }

      const cvUrl = `/uploads/cvs/${path.basename(cvFile.filepath)}`;

      // Update profile with CV URL
      await prisma.candidateProfile.update({
        where: { userId: candidateId },
        data: { cvUrl }
      });

      // Also create a document entry
      await prisma.document.create({
        data: {
          candidateId,
          title: cvFile.originalFilename || 'CV',
          filename: path.basename(cvFile.filepath),
          url: cvUrl,
          fileSize: cvFile.size,
          documentType: 'cv'
        }
      });

      return res.status(200).json({ cvUrl });
    });
  } catch (error) {
    console.error('CV upload error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
