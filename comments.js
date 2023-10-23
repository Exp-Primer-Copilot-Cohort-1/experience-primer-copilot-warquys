// Create web server

const express = require('express');
const bodyParser = require('body-parser');
const { randomBytes } = require('crypto');
const cors = require('cors');

// Create express app
const app = express();

// Add middleware
app.use(bodyParser.json());
app.use(cors());

// In-memory storage
const commentsByPostId = {};

// Routes
app.get('/posts/:id/comments', (req, res) => {
  res.send(commentsByPostId[req.params.id] || []);
});

// Create new comment
app.post('/posts/:id/comments', (req, res) => {
  // Generate random id
  const commentId = randomBytes(4).toString('hex');
  // Get post id from url
  const { id } = req.params;
  // Get comment content from request body
  const { content } = req.body;
  // Get comments array for this post
  const comments = commentsByPostId[id] || [];
  // Add new comment to comments array
  comments.push({ id: commentId, content, status: 'pending' });
  // Update comments array for this post
  commentsByPostId[id] = comments;
  // Emit event
  axios.post('http://localhost:4005/events', {
    type: 'CommentCreated',
    data: { id: commentId, content, postId: id, status: 'pending' },
  });
  // Send response
  res.status(201).send(comments);
});

// Receive events
app.post('/events', async (req, res) => {
  console.log('Event Received:', req.body.type);
  const { type, data } = req.body;
  if (type === 'CommentModerated') {
    const { id, postId, status, content } = data;
    const comments = commentsByPostId[postId];
    const comment = comments.find((comment) => comment.id === id);
    comment.status = status;
    await axios.post('http://localhost:4005/events', {
      type: 'CommentUpdated',
      data: { id, postId, status, content },
    });
  }
  res.send({});
});

// Start web server
app.listen(4001, () => {
  console.log('Listening on 4001');
});