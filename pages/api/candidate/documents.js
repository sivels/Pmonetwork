import { getToken } from 'next-auth/jwt';
import prisma from '../../../lib/prisma';
import multer from 'multer';
import nextConnect from 'next-connect';
import fs from 'fs';
import path from 'path';

const allowedTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/vnd.ms-powerpoint',
  'image/png',
  'image/jpeg',
  'image/gif',
];

const upload = multer({
  dest: './public/uploads/docs/',
  fileFilter: (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('File type not allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

const handler = nextConnect();

handler.use(async (req, res, next) => {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'CANDIDATE') return res.status(401).json({ error: 'Unauthorized' });
  req.userId = token.id;
  // get candidateId
  const candidate = await prisma.candidateProfile.findUnique({ where: { userId: req.userId } });
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
  req.candidateId = candidate.id;
  next();
});

handler.get(async (req, res) => {
  // List all documents for this candidate
  const docs = await prisma.document.findMany({ where: { candidateId: req.candidateId } });
  res.json(docs);
});

handler.post(upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded or file type not allowed' });
  // --- AI review placeholder ---
  // Here you would call an AI service to check the file content for applicability.
  // For now, we simulate approval. If not approved, delete file and return error.
  const aiApproved = true; // Replace with actual AI review logic
  if (!aiApproved) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'File rejected by AI review' });
  }
  // --- End AI review placeholder ---
  const ext = path.extname(req.file.originalname);
  const newName = req.candidateId + '-' + Date.now() + ext;
  const newPath = path.join('./public/uploads/docs', newName);
  fs.renameSync(req.file.path, newPath);
  const url = '/uploads/docs/' + newName;
  const doc = await prisma.document.create({
    data: {
      candidateId: req.candidateId,
      filename: req.file.originalname,
      url,
      isPublic: false,
    },
  });
  res.json(doc);
});

handler.put(async (req, res) => {
  // Toggle isPublic
  const { id, isPublic } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const doc = await prisma.document.update({
    where: { id },
    data: { isPublic: Boolean(isPublic) },
  });
  res.json(doc);
});

handler.delete(async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const doc = await prisma.document.delete({ where: { id } });
  // Optionally delete file from disk
  try {
    fs.unlinkSync(path.join('./public', doc.url));
  } catch {}
  res.json({ ok: true });
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler;
