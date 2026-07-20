import type { RequestHandler } from 'express';
import { Router } from 'express';
import { listAnalysesController } from '../controllers/analyses.controller';
import { analyzeController } from '../controllers/analyze.controller';
import { healthController, rootController } from '../controllers/health.controller';
import { upload } from '../middleware/upload';

export const router = Router();

router.get('/', rootController);
router.get('/health', healthController);
// Cast: @types/multer resolves against a stray @types/express@4 pulled in
// transitively by the (soon to be replaced) CRA client, which collides with
// our @types/express@5. Purely a type-identity issue, not a runtime one.
router.post('/analyze', upload.single('file') as unknown as RequestHandler, analyzeController);
router.get('/analyses', listAnalysesController);
