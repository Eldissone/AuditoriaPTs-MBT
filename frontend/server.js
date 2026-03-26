const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3001;

// Serve static files from the 'public' or 'dist' directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server is running on port ${PORT}`);
});
