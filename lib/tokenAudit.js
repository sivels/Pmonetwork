import fs from 'fs';
import path from 'path';

const LOG_DIR = path.resolve(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'token-audit.log');

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

export async function appendAudit(entry) {
  try {
    ensureLogDir();
    const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n';
    await fs.promises.appendFile(LOG_FILE, line, 'utf8');
  } catch (err) {
    // best-effort: don't throw in production code paths
    console.error('Failed to write token audit:', err);
  }
}

export default { appendAudit };
