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

  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user.role || '').toLowerCase() !== 'candidate') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.user.id;
  
  // Get the CandidateProfile ID
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId }
  });
  
  if (!profile) {
    return res.status(404).json({ error: 'Candidate profile not found' });
  }
  
  const candidateId = profile.id;

  try {
    // Use /tmp directory for serverless compatibility
    const uploadDir = '/tmp';

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
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

      // Read file and convert to base64
      const fileBuffer = fs.readFileSync(docFile.filepath);
      const base64Data = fileBuffer.toString('base64');
      const mimeType = docFile.mimetype || 'application/octet-stream';
      const dataUrl = `data:${mimeType};base64,${base64Data}`;
      
      // Clean up temp file
      fs.unlinkSync(docFile.filepath);

      const documentType = fields.documentType?.[0] || fields.documentType || 'other';
      const title = fields.title?.[0] || fields.title || docFile.originalFilename || 'Document';

      // Create document entry
      const document = await prisma.document.create({
        data: {
          candidateId,
          title,
          filename: docFile.originalFilename || 'document',
          url: dataUrl,
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
