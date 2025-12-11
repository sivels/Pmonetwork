import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role?.toLowerCase() !== 'candidate') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { candidateCandidateProfile: true }
  });

  if (!user?.candidateCandidateProfile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    filename: (name, ext, part) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      return `${name}-${uniqueSuffix}${ext}`;
    }
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'File upload failed' });
    }

    const file = files.file?.[0] || files.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const documentName = fields.documentName?.[0] || fields.documentName || file.originalFilename;
    const category = fields.category?.[0] || fields.category || 'other';
    const title = fields.title?.[0] || fields.title;
    const expiryDate = fields.expiryDate?.[0] || fields.expiryDate;

    const relativePath = `/uploads/documents/${path.basename(file.filepath)}`;

    try {
      const isPublic = category !== 'identity';

      const document = await prisma.document.create({
        data: {
          candidateId: user.candidateCandidateProfile.id,
          filename: documentName,
          url: relativePath,
          title: title || category,
          fileSize: file.size,
          documentType: category,
          isPublic: isPublic
        }
      });

      return res.status(200).json(document);
    } catch (error) {
      console.error('Database error:', error);
      // Clean up uploaded file on error
      fs.unlinkSync(file.filepath);
      return res.status(500).json({ error: 'Failed to save document' });
    }
  });
}
