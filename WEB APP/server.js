const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;

// Connect to MongoDB
const databaseUrl = 'mongodb://localhost:27017/Marketplace';
mongoose.connect(databaseUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB!');
});

// Load the User model
const User = require('./model/user');
// Load the Product model
const Product = require('./model/Product');
const { createSecretKey } = require('crypto');

// Serve static files from the public folder
app.use(express.static(__dirname + '/public'));

// Middleware to parse JSON-encoded bodies
app.use(express.json());

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Initialize session middleware
app.use(session({
  secret: 'WEB APP',
  resave: false,
  saveUninitialized: true,
}));

// Route to redirect to the login page
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Route to serve the login.html file
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/views/login.html');
});

// Route to serve the register.html file
app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/views/register.html');
});

// Route to handle user registration (POST method)
app.post('/register', async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  try {
    // Check if the username is already taken
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Check if the password and confirmPassword match
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the number of rounds

    // Create a new user document with hashed password
    const newUser = new User({ username, password: hashedPassword });

    // Save the user to the database
    await newUser.save();

    // Redirect the user to the login page after successful registration
    return res.redirect('/login');
  } catch (error) {
    console.error('Error during user registration:', error);
    return res.status(500).json({ error: 'An error occurred during registration' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find the user in the database
    const user = await User.findOne({ username });

    if (user) {
      // Compare the provided password with the stored hashed password
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        console.log('Login successful');
        // Set a session cookie to indicate the user is logged in
        req.session.username = user.username;
        
        return res.redirect('/main');
      }
    }

    console.log('Invalid username or password');
    return res.status(401).send('Invalid username or password');
  } catch (error) {
    console.error('Error during user login:', error);
    return res.status(500).json({ error: 'An error occurred during login' });
  }
});

app.get('/get_username', (req, res) => {
  try {
    // Check if the user is authenticated by verifying the session
    if (!req.session.username) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Return the username as JSON response
    return res.json({ username: req.session.username });
  } catch (error) {
    console.error('Error retrieving username:', error);
    return res.status(500).json({ error: 'An error occurred while retrieving the username' });
  }
});

app.get('/logout', (req, res) => {
  // Clear the session cookie to log the user out
  req.session.destroy((err) => {
    if (err) {
      console.error('Error during logout:', err);
      return res.status(500).json({ error: 'An error occurred during logout' });
    }
    console.log('Logout successful');
    return res.redirect('/login');
  });
});

app.get('/main', (req, res) => {
  try {
    // Check if the user is authenticated by verifying the session
    if (!req.session.username) {
      return res.status(401).redirect('/login'); // Redirect to login if the user is not authenticated
    }

    // Read the main.html file and replace the placeholder with the username
    const fs = require('fs');
    const mainHTML = fs.readFileSync(__dirname + '/views/main.html', 'utf8');
    const modifiedHTML = mainHTML.replace('SMOB', req.session.username);

    // Send the modified HTML to the client
    res.send(modifiedHTML);
  } catch (error) {
    console.error('Error serving main.html:', error);
    return res.status(500).json({ error: 'An error occurred while serving main.html' });
  }
});

// PRODUCT //
// Route to handle product submission (POST method)
app.post('/submit_product', async (req, res) => {
  try {
    // Extract product_name and price from the form data
    const { product_name, price } = req.body;

    // Create a new product document
    const newProduct = new Product({ product_name, price });

    // Save the product to the database
    await newProduct.save();

    // Redirect the user to the main page after successful product creation
    // We are passing the username as a query parameter to the main page
    const { username } = req.query;
    return res.redirect(`/main?username=${username}`);
  } catch (error) {
    console.error('Error during product submission:', error);
    return res.sendFile(__dirname + '/views/Product_input.html'); // Redirect back to the product input page
  }
});

app.get('/Product_input', (req, res) => {
  res.sendFile(__dirname + '/views/Product_input.html');
});

// GETTING THE PRODUCT // 
// Route to handle product retrieval (GET method)
app.get('/get_products', async (req, res) => {
  try {
    // Find all products in the database
    const products = await Product.find();

    // Send the products as JSON in the response
    return res.json(products);
  } catch (error) {
    console.error('Error retrieving products:', error);
    return res.status(500).json({ error: 'An error occurred while retrieving products' });
  }
});


app.get('/about', (req, res) => {
  res.sendFile(__dirname + '/views/about.html');
});


// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});


