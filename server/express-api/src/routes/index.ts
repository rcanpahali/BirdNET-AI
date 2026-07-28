import type { RequestHandler } from 'express';
import { Router } from 'express';
import { deleteAnalysisController, listAnalysesController, updateAnalysisController } from '../controllers/analyses.controller';
import { analyzeController } from '../controllers/analyze.controller';
import { healthController, rootController } from '../controllers/health.controller';
import {
  createProjectController,
  deleteProjectController,
  getProjectController,
  listProjectsController,
  updateProjectController,
} from '../controllers/projects.controller';
import { upload } from '../middleware/upload';

export const router = Router();

router.get('/', rootController);
router.get('/health', healthController);
// Cast: @types/multer resolves against a stray @types/express@4 pulled in
// transitively by the (soon to be replaced) CRA client, which collides with
// our @types/express@5. Purely a type-identity issue, not a runtime one.
router.post('/analyze', upload.single('file') as unknown as RequestHandler, analyzeController);
router.get('/analyses', listAnalysesController);
router.patch('/analyses/:id', updateAnalysisController);
router.delete('/analyses/:id', deleteAnalysisController);

router.get('/projects', listProjectsController);
router.post('/projects', createProjectController);
router.get('/projects/:id', getProjectController);
router.patch('/projects/:id', updateProjectController);
router.delete('/projects/:id', deleteProjectController);
