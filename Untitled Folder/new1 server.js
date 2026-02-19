const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Backend running successfully');
});

let tasks = [];
let currentId = 1;

// POST /tasks - CREATE
app.post('/tasks', (req, res, next) => {
    if (!req.body || !req.body.title || req.body.title.trim() === '') {
        return next(new Error('Title required'));
    }
    const newTask = {
        id: currentId++,
        title: req.body.title.trim()
    };
    tasks.push(newTask);
    res.status(201).json(newTask);
});

// GET /tasks - LIST ALL
app.get('/tasks', (req, res) => {
    res.status(200).json(tasks);
});

// GET /tasks/:id - SINGLE
app.get('/tasks/:id', (req, res, next) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        return next(new Error('ID must be a number'));
    }
res.status(200).json(task);
});

// DELETE /tasks/:id
app.delete('/tasks/:id', (req, res, next) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        return next(new Error('ID must be a number'));
    }
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) {
        return next(new Error('Task not found'));
    }
    tasks.splice(index, 1);
    res.status(204).send();
});

// GLOBAL ERROR HANDLER (LAST)
app.use((err, req, res, next) => {
    console.error(err.stack);  // Log error to terminal
    res.status(500).json({
        errors: [{ message: err.message }]
    });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});


