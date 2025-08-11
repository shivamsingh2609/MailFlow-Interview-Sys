import express from 'express';
import {
  getContacts,
  createContact,
  updateContact,
  deleteContact
} from '../controllers/contactController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/',verifyToken, getContacts);
router.post('/',verifyToken, createContact);
router.put('/:id',verifyToken, updateContact);
router.delete('/:id',verifyToken, deleteContact);

export default router;
