const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const examController = require('../controllers/examController');

// Create exam code
router.post('/create', examController.createExam);

// Get all exam codes
router.get('/list', examController.getExams);

// Upload question to exam
router.post('/:examCode/upload', upload.single('image'), examController.uploadQuestion);

// Get questions for exam
router.get('/:examCode/questions', examController.getQuestionsForExam);

// Compare image (dual matching)
router.post('/compare', upload.single('image'), examController.compareImage);

// Delete question
router.delete('/question/:questionId', examController.removeQuestion);

// Get statistics
router.get('/stats', examController.getStats);

module.exports = router;
