const { getDB } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a new exam code
 * @param {string} examCode - The exam code
 * @returns {Promise<Object>} - Created exam code document
 */
const createExamCode = async (examCode) => {
  const db = getDB();
  const examsCollection = db.collection('exams');

  const existingExam = await examsCollection.findOne({ examCode });
  if (existingExam) {
    throw new Error(`Exam code "${examCode}" already exists`);
  }

  const newExam = {
    _id: uuidv4(),
    examCode,
    createdAt: new Date(),
    questionCount: 0,
  };

  await examsCollection.insertOne(newExam);
  return newExam;
};

/**
 * Get all exam codes
 * @returns {Promise<Array>} - List of exam codes
 */
const getAllExamCodes = async () => {
  const db = getDB();
  const examsCollection = db.collection('exams');

  const exams = await examsCollection.find({}).toArray();
  return exams;
};

/**
 * Store a question in the database
 * @param {Object} questionData - Question data
 * @returns {Promise<Object>} - Stored question document
 */
const storeQuestion = async (questionData) => {
  const db = getDB();
  const questionsCollection = db.collection('questions');

  const question = {
    _id: uuidv4(),
    ...questionData,
    createdAt: new Date(),
  };

  await questionsCollection.insertOne(question);

  // Update exam question count
  const examsCollection = db.collection('exams');
  await examsCollection.updateOne(
    { examCode: questionData.examCode },
    { $inc: { questionCount: 1 } }
  );

  return question;
};

/**
 * Get questions by exam code
 * @param {string} examCode - The exam code
 * @returns {Promise<Array>} - Questions for the exam code
 */
const getQuestionsByExamCode = async (examCode) => {
  const db = getDB();
  const questionsCollection = db.collection('questions');

  const questions = await questionsCollection
    .find({ examCode })
    .toArray();

  return questions;
};

/**
 * Get all questions
 * @returns {Promise<Array>} - All questions
 */
const getAllQuestions = async () => {
  const db = getDB();
  const questionsCollection = db.collection('questions');

  const questions = await questionsCollection.find({}).toArray();
  return questions;
};

/**
 * Get question by ID
 * @param {string} questionId - The question ID
 * @returns {Promise<Object>} - Question document
 */
const getQuestionById = async (questionId) => {
  const db = getDB();
  const questionsCollection = db.collection('questions');

  const question = await questionsCollection.findOne({ _id: questionId });
  return question;
};

/**
 * Delete question by ID
 * @param {string} questionId - The question ID
 * @returns {Promise<Object>} - Deletion result
 */
const deleteQuestion = async (questionId) => {
  const db = getDB();
  const questionsCollection = db.collection('questions');

  const question = await questionsCollection.findOne({ _id: questionId });
  if (!question) {
    throw new Error('Question not found');
  }

  const result = await questionsCollection.deleteOne({ _id: questionId });

  // Update exam question count
  const examsCollection = db.collection('exams');
  await examsCollection.updateOne(
    { examCode: question.examCode },
    { $inc: { questionCount: -1 } }
  );

  return result;
};

module.exports = {
  createExamCode,
  getAllExamCodes,
  storeQuestion,
  getQuestionsByExamCode,
  getAllQuestions,
  getQuestionById,
  deleteQuestion,
};
