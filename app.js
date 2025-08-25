const express = require('express')

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

// Hello world route
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

// Health check route 
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})

module.exports = app