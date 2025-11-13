// index.js file

// Import required modules.
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const path = require("path");
const PropertiesReader = require("properties-reader");
const fs = require('fs');

// Create the express app.
const app = express();
app.use(cors());
app.use(express.json());
app.set('json spaces', 3);  

// Use env variable if set, otherwise default to 3000.
const PORT = process.env.PORT || 3000; 

// Listen on the specified port.
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// -----------------------------
// Load DB connection properties
const propertiesPath = path.resolve(__dirname, "./config/dbconnection.properties");
const properties = PropertiesReader(propertiesPath);

const dbPrefix = properties.get('db.prefix');   
const dbHost = properties.get('db.host');       
const dbName = 'XLearning';                      
const dbUser = properties.get('db.user');       
const dbPassword = properties.get('db.password'); 
const dbParams = properties.get('db.params');   

// Build MongoDB URI
const uri = `${dbPrefix}${dbUser}:${dbPassword}${dbHost}${dbParams}`;
const client = new MongoClient(uri);

// Global variable for the database connection.
let db1; 

// -----------------------------
// Connect to MongoDB
async function connectDB() {
    try {
        await client.connect();
        db1 = client.db(dbName);
        // console.log("Connected to MongoDB:", dbName);
    } catch (err) {
        console.error("MongoDB connection error:", err);
    }
}

// Connect to the database when the server starts.
connectDB();

// ------------------------------ Create a logger file -----------------------------
const logFile = path.join(__dirname, 'server.log');

// ----------------------------- Define Middleware and Routes -----------------------------

// Logger middleware that output all requests to the server console.
app.use((req, res, next) => {
    const now = new Date(); // store current date and time.
    const formattedDateTime = now.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'medium' }); // format date and time.
    const logMessage = `Received request at ${formattedDateTime}: Method = ${req.method} | URL = ${req.url}\n`;
    console.log(logMessage.trim());

    // Append to log file
    fs.appendFile(logFile, logMessage, (err) => {
        if (err) console.error('Error writing to log file', err);
    });
    next();
})

// Static file middleware to serve lesson images and an error message if the image file is not found.
app.use('/lessons', express.static(path.join(__dirname,'public/images/lessons'))); // serve lesson images from 'images/lessons' directory.))

// Fallback route for handling 404 errors for lessons static files.
app.use('/lessons',(req, res) => {
    const logMessage = `Error 404: Lesson image ${req.url} was not found.\n`;
    res.status(404).send(`Lesson image ${req.url} was not found.`);
    console.log(`Error 404: Lesson image ${req.url} was not found.`);

    // Append to log file
    fs.appendFile(logFile, logMessage, (err) => {
        if (err) console.error('Error writing to log file', err);
    });
})

// Middleware: Attach collection to req
app.param('collectionName', (req, res, next, collectionName) => {
    try {
        if (!db1) throw new Error("DB not connected yet");
        req.collection = db1.collection(collectionName);
        console.log("Middleware set collection:", req.collection.collectionName);
        next();
    } catch (err) {
        console.error("Error in collection middleware:", err);
        res.status(500).send("Collection middleware error");
    }
});

// -----------------------------
// GET all documents
app.get('/collections/:collectionName', async (req, res) => {
    console.log("Requesting collection:", req.params.collectionName);
    console.log("Mongo collection object:", req.collection);
    try {
        const docs = await req.collection.find({}).toArray();
        console.log("Number of documents fetched:", docs.length);
        res.json(docs);
    } catch (err) {
        console.error("Error fetching collection:", err);
        res.status(500).send("Error fetching data");
    }
});