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
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filename: (name, ext, part) => {
        return `doc-${candidateId}-${Date.now()}${ext}`;
      }
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Document upload error:', err);
        return res.status(500).json({ error: 'Upload failed' });
      }

      const docFile = files.document?.[0] || files.document;
      if (!docFile) {
        return res.status(400).json({ error: 'No document file provided' });
      }

      const docUrl = `/uploads/documents/${path.basename(docFile.filepath)}`;
      const documentType = fields.documentType?.[0] || fields.documentType || 'other';
      const title = fields.title?.[0] || fields.title || docFile.originalFilename || 'Document';

      // Create document entry
      const document = await prisma.document.create({
        data: {
          candidateId,
          title,
          filename: path.basename(docFile.filepath),
          url: docUrl,
          fileSize: docFile.size,
          documentType
        }
      });

      return res.status(200).json({ document: JSON.parse(JSON.stringify(document)) });
    });
  } catch (error) {
    console.error('Document upload error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
