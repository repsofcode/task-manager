require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());

// Dummy user ID for testing (until we add authentication)
const DUMMY_USER_ID = "69929a777f222810701fda6c";

app.get('/', (req, res) => {
    res.send('Backend running successfully');
});

// MongoDB Atlas Connection - Server starts ONLY after connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ Connected to MongoDB Atlas");
        
        // START SERVER ONLY AFTER DB CONNECTS
        app.listen(3000, () => {
            console.log("✅ Server running on port 3000");
        });
    })
    .catch(err => {
        console.error("❌ MongoDB connection failed:", err);
        process.exit(1);
    });

// ========================================
// USER SCHEMA + PRE-SAVE HOOK + MODEL
// ========================================
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    }
}, {
    timestamps: true
});

// Pre-save hook for password hashing
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

const User = mongoose.model('User', userSchema);

// ========================================
// TASK SCHEMA + MODEL
// ========================================
const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

const Task = mongoose.model('Task', taskSchema);

// ========================================
// ROUTES - ALL USER-SCOPED
// ========================================

// POST /tasks - CREATE (with user isolation)
app.post('/tasks', async (req, res, next) => {
    try {
        const task = await Task.create({
            title: req.body.title,
            user: DUMMY_USER_ID
        });
        res.status(201).json(task);
    } catch (err) {
        next(err);
    }
});

// GET /tasks - LIST ALL (filtered by user)
app.get('/tasks', async (req, res, next) => {
    try {
        const tasks = await Task.find({ user: DUMMY_USER_ID });
        res.status(200).json(tasks);
    } catch (err) {
        next(err);
    }
});

// GET /tasks/:id - SINGLE (with user isolation check)
app.get('/tasks/:id', async (req, res, next) => {
    try {
        const id = req.params.id;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            const err = new Error("Invalid ID format");
            err.status = 400;
            return next(err);
        }
        
        const task = await Task.findOne({ _id: id, user: DUMMY_USER_ID });
        
        if (!task) {
            const err = new Error("Task not found");
            err.status = 404;
            return next(err);
        }
        
        res.status(200).json(task);
    } catch (err) {
        next(err);
    }
});

// DELETE /tasks/:id (with user isolation)
app.delete('/tasks/:id', async (req, res, next) => {
    try {
        const id = req.params.id;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            const err = new Error("Invalid ID format");
            err.status = 400;
            return next(err);
        }
        
        const task = await Task.findOneAndDelete({ _id: id, user: DUMMY_USER_ID });
        
        if (!task) {
            const err = new Error("Task not found");
            err.status = 404;
            return next(err);
        }
        
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

// GLOBAL ERROR HANDLER (LAST)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        errors: [{ message: err.message }]
    });
});
