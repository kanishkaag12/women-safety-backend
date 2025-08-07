const mongoose = require('mongoose');
const uri = "mongodb+srv://kanishkaagarwal:twtwls321@cluster0.6cqt9t9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Successfully connected to MongoDB Atlas!');
}).catch((err) => {
  console.error('Connection failed:', err);
});