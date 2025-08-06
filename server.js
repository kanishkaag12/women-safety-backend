// Import the express package
const express = require('express');
const app = express();
const port = 5000; // The port our server will run on

// Use express.json() middleware to parse JSON requests
app.use(express.json());

// A simple test route to ensure the server is working
app.get('/', (req, res) => {
  res.send('Hello from the Women Safety Analytics Backend!');
});

// Start the server and listen on the specified port
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});