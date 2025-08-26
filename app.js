const express = require('express')

const app = express()

app.use(express.json())

// Hello world route
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

// Health check route 
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app