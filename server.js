const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config(); //This command loads all the variables from your .env file into process.env, making them available in your code. This is where your MONGODB_URI will be loaded.

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json()); //This is a middleware function that tells Express to parse incoming requests with JSON payloads. This is necessary for your server to be able to read and understand the JSON data that your frontend will send.

app.use(cors()); //This line adds the cors middleware to your application, allowing requests from your frontend's domain to access your backend.

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB Atlas');
}).catch(err => {
    console.error('Could not connect to MongoDB Atlas', err);
});

// A simple test route to ensure the server is still working
app.get('/', (req, res) => {
  res.send('Hello from the Women Safety Analytics Backend!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});