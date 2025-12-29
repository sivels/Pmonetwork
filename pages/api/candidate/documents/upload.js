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

  // Use /tmp directory for serverless compatibility
  const uploadDir = '/tmp';

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
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

    try {
      // Read file and convert to base64
      const fileBuffer = fs.readFileSync(file.filepath);
      const base64Data = fileBuffer.toString('base64');
      const mimeType = file.mimetype || 'application/octet-stream';
      const dataUrl = `data:${mimeType};base64,${base64Data}`;
      
      // Clean up temp file
      fs.unlinkSync(file.filepath);

      const isPublic = category !== 'identity';

      const document = await prisma.document.create({
        data: {
          candidateId: user.candidateCandidateProfile.id,
          filename: documentName,
          url: dataUrl,
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
