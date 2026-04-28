import { getToken } from 'next-auth/jwt';
import multer from 'multer';
import nextConnect from 'next-connect';
import fs from 'fs';
import path from 'path';
import { prisma } from '../../../lib/prisma';
import { resolveEmployerContext } from '../../../lib/employerContext';

const uploadDir = './public/uploads/offers';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/png',
  'image/jpeg',
  'text/plain',
];

const upload = multer({
  dest: uploadDir,
  fileFilter: (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('File type not allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

const handler = nextConnect();

handler.use(async (req, res, next) => {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'EMPLOYER') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.userId = token.id;
  req.userEmail = token.email;
  next();
});

handler.post(upload.single('file'), async (req, res) => {
  try {
    const { applicationId } = req.body || {};

    if (!applicationId || !req.file) {
      return res.status(400).json({ error: 'applicationId and file are required' });
    }

    const employerContext = await resolveEmployerContext({
      userId: req.userId,
      email: req.userEmail,
    });

    if (!employerContext?.employerProfile?.id) {
      return res.status(403).json({ error: 'Employer context not found' });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
      },
    });

    if (!application || application.job.employerId !== employerContext.employerProfile.id) {
      return res.status(403).json({ error: 'You do not have permission to upload attachments for this application' });
    }

    const ext = path.extname(req.file.originalname);
    const safeExt = ext || '.bin';
    const newName = `${employerContext.employerProfile.id}-${applicationId}-${Date.now()}-${Math.round(Math.random() * 1e6)}${safeExt}`;
    const newPath = path.join(uploadDir, newName);

    fs.renameSync(req.file.path, newPath);

    const fileMeta = {
      name: req.file.originalname,
      url: `/uploads/offers/${newName}`,
      type: req.file.mimetype,
      size: req.file.size,
    };

    return res.status(200).json({ file: fileMeta });
  } catch (error) {
    console.error('Error uploading offer attachment:', error);
    return res.status(500).json({ error: 'Failed to upload attachment' });
  }
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler;
