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
    // Create profile if it doesn't exist
    const newProfile = await prisma.candidateProfile.create({
      data: { userId, fullName: session.user.email?.split('@')[0] || 'User' }
    });
    var candidateId = newProfile.id;
  } else {
    var candidateId = profile.id;
  }

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
        console.error('CV upload error:', err);
        return res.status(500).json({ error: 'Upload failed' });
      }

      const cvFile = files.cv?.[0] || files.cv;
      if (!cvFile) {
        return res.status(400).json({ error: 'No CV file provided' });
      }

      // Read file and convert to base64
      const fileBuffer = fs.readFileSync(cvFile.filepath);
      const base64Data = fileBuffer.toString('base64');
      const mimeType = cvFile.mimetype || 'application/pdf';
      const dataUrl = `data:${mimeType};base64,${base64Data}`;
      
      // Clean up temp file
      fs.unlinkSync(cvFile.filepath);

      // Update profile with CV data URL
      await prisma.candidateProfile.update({
        where: { id: candidateId },
        data: { cvUrl: dataUrl }
      });

      // Also create a document entry
      await prisma.document.create({
        data: {
          candidateId,
          title: cvFile.originalFilename || 'CV',
          filename: cvFile.originalFilename || 'cv.pdf',
          url: dataUrl,
          fileSize: cvFile.size,
          documentType: 'cv'
        }
      });

      return res.status(200).json({ cvUrl: dataUrl });
    });
  } catch (error) {
    console.error('CV upload error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
