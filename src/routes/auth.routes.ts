import { Router } from 'express';
import { register, login, phoneLogin, checkPhone } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/phone-login', phoneLogin);
router.post('/check-phone', checkPhone);

export default router;
