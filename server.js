require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Backend running successfully');
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ Connected to MongoDB Atlas");
        app.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error("❌ MongoDB connection failed:", err);
        process.exit(1);
    });

//USER SCHEMA 
const userSchema = new mongoose.Schema(
    {
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
            minlength: 6,
            select: false
        }
    },
    {
        timestamps: true
    }
);

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

const User = mongoose.model('User', userSchema);


// task schema 
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


// AUTH MIDDLEWARE

function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        next();

    } catch (err) {
        return res.status(401).json({ message: "Unauthorized" });
    }
}


// AUTH ROUTES

// POST /register
app.post('/register', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        
        if (!email || !password) {
            const err = new Error("Email and password are required");
            err.status = 400;
            return next(err);
        }

        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            const err = new Error("Email already in use");
            err.status = 400;
            return next(err);
        }

        
        const user = await User.create({ email, password });

        
        res.status(201).json(user);

    } catch (err) {
        next(err);
    }
});

app.post('/login', async (req, res, next) => {
    try {
        
        const { email, password } = req.body;
        if (!email || !password) {
            const err = new Error("Invalid credentials");
            err.status = 400;
            return next(err);
        }
        const user = await User.findOne({ email }).select('+password');

        
        if (!user) {
            const err = new Error("Invalid credentials");
            err.status = 400;
            return next(err);
        }


        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            const err = new Error("Invalid credentials");
            err.status = 400;
            return next(err);
        }

        
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        
        res.status(200).json({ token });

    } catch (err) {
        next(err);
    }
});


// TASK ROUTES 


// POST /tasks
app.post('/tasks', authMiddleware, async (req, res, next) => {
    try {
        const task = await Task.create({
            title: req.body.title,
            user: req.user.userId
        });
        res.status(201).json(task);
    } catch (err) {
        next(err);
    }
});


app.get('/tasks', authMiddleware, async (req, res, next) => {
    try {
        const tasks = await Task.find({ user: req.user.userId });
        res.status(200).json(tasks);
    } catch (err) {
        next(err);
    }
});


app.get('/tasks/:id', authMiddleware, async (req, res, next) => {
    try {
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            const err = new Error("Invalid ID format");
            err.status = 400;
            return next(err);
        }

        const task = await Task.findOne({ _id: id, user: req.user.userId });

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


app.delete('/tasks/:id', authMiddleware, async (req, res, next) => {
    try {
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            const err = new Error("Invalid ID format");
            err.status = 400;
            return next(err);
        }

        const task = await Task.findOneAndDelete({ _id: id, user: req.user.userId });

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

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        errors: [{ message: err.message }]
    });
});
