// index.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Data storage (in production, use a database instead)
let questions = [
    {
        id: 1,
        optionA: "ว่ายน้ำกับฉลาม",
        optionB: "เดินป่าที่มีหมีอยู่",
        votesA: 65,
        votesB: 35
    },
    {
        id: 2,
        optionA: "มีพลังล่องหน",
        optionB: "มีพลังอ่านใจคนอื่น",
        votesA: 40,
        votesB: 60
    },
    {
        id: 3,
        optionA: "ไม่ใช้อินเทอร์เน็ตเป็นเวลา 1 ปี",
        optionB: "ไม่กินของหวานเป็นเวลา 3 ปี",
        votesA: 25,
        votesB: 75
    },
    {
        id: 4,
        optionA: "พูดได้เฉพาะความจริงตลอดชีวิต",
        optionB: "โกหกทุกครั้งที่พูด",
        votesA: 70,
        votesB: 30
    },
    {
        id: 5,
        optionA: "ย้อนเวลากลับไปแก้ไขความผิดพลาดครั้งใหญ่ในชีวิต",
        optionB: "มองเห็นอนาคตของตัวเองในอีก 10 ปี",
        votesA: 45,
        votesB: 55
    },
    {
        id: 6,
        optionA: "เป็นคนที่เก่งที่สุดในสิ่งที่คุณไม่ชอบ",
        optionB: "เป็นคนที่แย่ที่สุดในสิ่งที่คุณรัก",
        votesA: 35,
        votesB: 65
    },
    {
        id: 7,
        optionA: "ไม่สามารถใช้โทรศัพท์มือถือได้อีกเลย",
        optionB: "ไม่สามารถใช้คอมพิวเตอร์ได้อีกเลย",
        votesA: 60,
        votesB: 40
    },
    {
        id: 8,
        optionA: "มีเงิน 1 ล้านบาทตอนนี้",
        optionB: "มีเงิน 10 ล้านบาทในอีก 10 ปี",
        votesA: 30,
        votesB: 70
    },
    {
        id: 9,
        optionA: "พูดได้ทุกภาษาในโลก",
        optionB: "เล่นดนตรีได้ทุกเครื่องดนตรี",
        votesA: 75,
        votesB: 25
    },
    {
        id: 10,
        optionA: "ไม่ต้องนอนอีกเลย",
        optionB: "ไม่ต้องกินอาหารอีกเลย",
        votesA: 55,
        votesB: 45
    }
];

// Store user sessions to prevent duplicate votes
const userSessions = new Map();

// API Routes
app.get('/api/questions', (req, res) => {
    // Return questions without vote counts
    const questionsWithoutVotes = questions.map(q => ({
        id: q.id,
        optionA: q.optionA,
        optionB: q.optionB
    }));
    
    res.json(questionsWithoutVotes);
});

app.post('/api/submit-answer', (req, res) => {
    const { questionId, selectedOption, sessionId } = req.body;
    
    // Validate input
    if (!questionId || !selectedOption || !sessionId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Find question
    const question = questions.find(q => q.id === questionId);
    if (!question) {
        return res.status(404).json({ error: 'Question not found' });
    }
    
    // Check if user already answered this question
    const userAnswers = userSessions.get(sessionId) || {};
    if (!userAnswers[questionId]) {
        // Record user's answer
        userAnswers[questionId] = selectedOption;
        userSessions.set(sessionId, userAnswers);
        
        // Update vote count
        if (selectedOption === 'A') {
            question.votesA++;
        } else if (selectedOption === 'B') {
            question.votesB++;
        }
        
        // Save updated questions to file (in a real app, use a database)
        saveQuestionsToFile().catch(err => console.error('Error saving questions:', err));
    }
    
    // Determine correct answer (majority vote)
    const correctAnswer = question.votesA > question.votesB ? 'A' : 'B';
    
    // Return results
    res.json({
        votesA: question.votesA,
        votesB: question.votesB,
        correctAnswer
    });
});

app.post('/api/submit-score', (req, res) => {
    const { score, totalQuestions, sessionId } = req.body;
    
    // Validate input
    if (score === undefined || !totalQuestions || !sessionId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // In a real app, you would store scores in a database
    console.log(`User ${sessionId} scored ${score}/${totalQuestions}`);
    
    // Return success
    res.json({ success: true });
});

// Serve the main HTML file for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Helper function to save questions to file
async function saveQuestionsToFile() {
    try {
        await fs.writeFile(
            path.join(__dirname, 'data', 'questions.json'),
            JSON.stringify(questions, null, 2)
        );
    } catch (error) {
        console.error('Error saving questions to file:', error);
    }
}

// Helper function to load questions from file
async function loadQuestionsFromFile() {
    try {
        const data = await fs.readFile(path.join(__dirname, 'data', 'questions.json'), 'utf8');
        questions = JSON.parse(data);
        console.log('Questions loaded from file');
    } catch (error) {
        console.error('Error loading questions from file:', error);
        console.log('Using default questions');
        
        // Create data directory if it doesn't exist
        try {
            await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
            await saveQuestionsToFile();
        } catch (err) {
            console.error('Error creating data directory:', err);
        }
    }
}

// Start server
async function startServer() {
    try {
        await loadQuestionsFromFile();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
    }
}

startServer();