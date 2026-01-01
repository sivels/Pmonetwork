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
    if (!session || (session.user.role || '').toLowerCase() !== 'employer') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { employerEmployerProfile: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const employerId = user.id;
    const profile = user.employerEmployerProfile;

    // Create profile if it doesn't exist
    if (!profile) {
      await prisma.employerProfile.create({
        data: { userId: employerId }
      });
    }

    // Use /tmp directory for Vercel serverless
    const uploadDir = path.join('/tmp', 'uploads', 'logos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      filename: (name, ext, part) => {
        return `${employerId}-${Date.now()}${ext}`;
      }
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Logo upload error:', err);
        return res.status(500).json({ error: 'Upload failed', details: err.message });
      }

      const logoFile = files.logo?.[0] || files.logo;
      if (!logoFile) {
        return res.status(400).json({ error: 'No logo file provided' });
      }

      // Read file and convert to base64 for storage (since Vercel is serverless)
      const fileBuffer = fs.readFileSync(logoFile.filepath);
      const base64Data = fileBuffer.toString('base64');
      const mimeType = logoFile.mimetype || 'image/jpeg';
      const dataUrl = `data:${mimeType};base64,${base64Data}`;

      // Clean up temp file
      fs.unlinkSync(logoFile.filepath);

      // Update profile with base64 data URL
      await prisma.employerProfile.update({
        where: { userId: employerId },
        data: { logoUrl: dataUrl }
      });

      return res.status(200).json({ logoUrl: dataUrl });
    });
  } catch (error) {
    console.error('Logo upload error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
