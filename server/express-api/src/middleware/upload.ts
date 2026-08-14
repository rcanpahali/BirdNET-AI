import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import multer from 'multer';
import { config } from '../config';

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, os.tmpdir()),
  filename: (_req, file, callback) => {
    const ext = path.extname(file.originalname);
    callback(null, `birdnet-upload-${crypto.randomUUID()}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSize },
});
