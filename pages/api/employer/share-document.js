import { getToken } from 'next-auth/jwt';
import prisma from '../../../lib/prisma';
import multer from 'multer';
import nextConnect from 'next-connect';
import fs from 'fs';
import path from 'path';

const allowedTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/png',
  'image/jpeg',
];

const upload = multer({
  dest: './public/uploads/shared/',
  fileFilter: (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('File type not allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

const handler = nextConnect();

handler.use(async (req, res, next) => {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'EMPLOYER') return res.status(401).json({ error: 'Unauthorized' });
  req.userId = token.id;
  next();
});

handler.post(upload.single('file'), async (req, res) => {
  const { candidateId } = req.body;
  if (!candidateId || !req.file) return res.status(400).json({ error: 'Missing candidateId or file' });
  const employer = await prisma.employerProfile.findUnique({ where: { userId: req.userId } });
  if (!employer) return res.status(404).json({ error: 'Employer not found' });
  const ext = path.extname(req.file.originalname);
  const newName = employer.id + '-' + candidateId + '-' + Date.now() + ext;
  const newPath = path.join('./public/uploads/shared', newName);
  fs.renameSync(req.file.path, newPath);
  const url = '/uploads/shared/' + newName;
  const doc = await prisma.sharedDocument.create({
    data: {
      employerId: employer.id,
      candidateId,
      filename: req.file.originalname,
      url,
      status: 'SHARED',
      auditTrail: [{ action: 'SHARED', by: 'EMPLOYER', at: new Date().toISOString() }],
    },
  });
  res.json(doc);
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler;
