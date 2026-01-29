const fs = require('fs');
const path = require('path');
const { extractTextFromImage, normalizeText } = require('../services/ocrService');
const { generatePerceptualHash } = require('../services/imageMatchService');
const { performDualMatching, generateMatchReport } = require('../services/comparisonService');
const {
  createExamCode,
  getAllExamCodes,
  storeQuestion,
  getQuestionsByExamCode,
  getAllQuestions,
  deleteQuestion,
} = require('../services/databaseService');

/**
 * Create a new exam code
 * POST /exam/create
 */
const createExam = async (req, res, next) => {
  try {
    const { examCode } = req.body;

    if (!examCode || examCode.trim() === '') {
      return res.status(400).json({ error: 'examCode is required' });
    }

    const newExam = await createExamCode(examCode.trim());

    res.status(201).json({
      message: 'Exam code created successfully',
      exam: newExam,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all exam codes
 * GET /exam/list
 */
const getExams = async (req, res, next) => {
  try {
    const exams = await getAllExamCodes();

    res.status(200).json({
      totalExams: exams.length,
      exams,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload question to exam code
 * POST /exam/:examCode/upload
 */
const uploadQuestion = async (req, res, next) => {
  try {
    const { examCode } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const imagePath = req.file.path;
    const imageUrl = `/uploads/${req.file.filename}`;

    console.log(`📸 Processing upload: ${req.file.originalname}`);

    // Step 1: Extract text using OCR
    const extractedText = await extractTextFromImage(imagePath);

    // Provide feedback even if text is short
    if (!extractedText || extractedText.trim().length < 5) {
      fs.unlinkSync(imagePath);
      return res.status(400).json({
        error: 'Could not extract sufficient text from image',
        extractedChars: extractedText.length,
        suggestions: [
          'Use higher quality image (JPG preferred over PNG)',
          'Ensure image has black text on white/light background',
          'Make sure text is horizontal (not rotated)',
          'Increase image contrast if text is faint',
          'Crop image to show only the text area',
          'Minimum recommended image width: 300 pixels',
        ],
      });
    }

    // Step 2: Normalize text
    const normalizedText = normalizeText(extractedText);

    // Step 3: Generate image hash
    const imageHash = await generatePerceptualHash(imagePath);

    // Step 4: Store in database
    const question = await storeQuestion({
      examCode,
      imageUrl,
      imageHash,
      extractedText,
      normalizedText,
    });

    console.log(`✅ Question stored successfully`);

    res.status(201).json({
      message: 'Question uploaded and processed successfully',
      question: {
        _id: question._id,
        examCode: question.examCode,
        imageUrl: question.imageUrl,
        extractedText: question.extractedText.substring(0, 200),
        extractedCharCount: question.extractedText.length,
        uploadedAt: question.createdAt,
      },
      ocrQuality: {
        extractedChars: question.extractedText.length,
        status: question.extractedText.length > 50 ? 'GOOD' : 'FAIR',
      },
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

/**
 * Get questions by exam code
 * GET /exam/:examCode/questions
 */
const getQuestionsForExam = async (req, res, next) => {
  try {
    const { examCode } = req.params;

    const questions = await getQuestionsByExamCode(examCode);

    res.status(200).json({
      examCode,
      totalQuestions: questions.length,
      questions: questions.map(q => ({
        _id: q._id,
        imageUrl: q.imageUrl,
        extractedText: q.extractedText, // Show full extracted text
        extractedTextLength: q.extractedText.length,
        createdAt: q.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Compare uploaded image against all stored questions using extracted text
 * POST /exam/compare
 */
const compareImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const imagePath = req.file.path;
    // Use body values if provided, otherwise use improved defaults
    const textThreshold = req.body.textThreshold !== undefined ? parseFloat(req.body.textThreshold) : 0.55;

    // Validate threshold
    if (textThreshold < 0 || textThreshold > 1) {
      fs.unlinkSync(imagePath);
      return res
        .status(400)
        .json({ error: 'Text threshold must be between 0 and 1' });
    }

    // Step 1: Extract text from uploaded image
    const uploadedText = await extractTextFromImage(imagePath);

    if (!uploadedText || uploadedText.trim().length === 0) {
      fs.unlinkSync(imagePath);
      return res
        .status(400)
        .json({
          error: 'Could not extract text from uploaded image',
          suggestions: [
            'Ensure image has readable text',
            'Try higher quality image',
            'Ensure text is horizontal and not rotated',
          ],
        });
    }

    console.log(`🔍 OCR extracted ${uploadedText.length} characters from uploaded image`);

    // Step 2: Get all stored questions
    const allQuestions = await getAllQuestions();

    if (allQuestions.length === 0) {
      fs.unlinkSync(imagePath);
      return res.status(404).json({
        status: 'NO_MATCHES',
        reason: 'No questions in database to compare against',
        results: [],
      });
    }

    // Step 3: Perform text-based matching using extracted text
    const matchingResult = await performDualMatching(
      imagePath,
      allQuestions,
      null,
      textThreshold
    );

    // Step 4: Generate report
    const report = generateMatchReport(matchingResult.results);

    // Clean up uploaded image
    fs.unlinkSync(imagePath);

    res.status(200).json({
      status: matchingResult.status,
      uploadedTextPreview: uploadedText.substring(0, 300),
      uploadedTextLength: uploadedText.length,
      topMatch: matchingResult.topMatch || null,
      thresholdsUsed: {
        textThreshold,
      },
      suggestedThresholds: matchingResult.suggestedThresholds || null,
      report,
      results: matchingResult.results,
      debugInfo: matchingResult.debugInfo || null,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

/**
 * Delete question
 * DELETE /exam/question/:questionId
 */
const removeQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;

    const result = await deleteQuestion(questionId);

    res.status(200).json({
      message: 'Question deleted successfully',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get statistics
 * GET /exam/stats
 */
const getStats = async (req, res, next) => {
  try {
    const exams = await getAllExamCodes();
    const allQuestions = await getAllQuestions();

    const stats = {
      totalExams: exams.length,
      totalQuestions: allQuestions.length,
      exams: exams.map(exam => ({
        examCode: exam.examCode,
        questionCount: exam.questionCount,
      })),
    };

    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExam,
  getExams,
  uploadQuestion,
  getQuestionsForExam,
  compareImage,
  removeQuestion,
  getStats,
};
