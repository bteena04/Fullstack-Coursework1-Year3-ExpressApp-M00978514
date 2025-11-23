// index.js file

// Import required modules.
const dotenv = require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const path = require("path");
const PropertiesReader = require("properties-reader");
const fs = require('fs');
const { orderSchema } = require("./helper/orderValidator.js");
const { number } = require("joi");
const { text } = require("stream/consumers");



// Create the express app.
const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "DELETE"],
}));
app.use(express.json());
app.set('json spaces', 3);  

// Use env variable if set, otherwise default to 3000.
const PORT = process.env.PORT || 3000; 

// Listen on the specified port.
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// -----------------------------
// Load DB connection properties
const propertiesPath = path.resolve(__dirname, "./config/dbconnection.properties");
const properties = PropertiesReader(propertiesPath);

const dbPrefix = properties.get('db.prefix');   
const dbHost = properties.get('db.host');       
const dbName = properties.get('db.name');                      
const dbUser = properties.get('db.user');       
const dbPassword = properties.get('db.password'); 
const dbParams = properties.get('db.params');   

// Build MongoDB URI
const client = new MongoClient(process.env.MONGO_URI);

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

// Root route to confirm server is running and database connection status.
app.get('/', (req,res) =>{
    if(db1){
        res.send({
            status: "ok",
            message: "Backend server is running and connected to database.",
            dbConnected: true
        });
    } else {
        res.status(500).send({
            status: "error",
            message: "Backend server is running but unable to connect to database.",
            dbConnected: false
        });
    }
});

// Static file middleware to serve lesson images and an error message if the image file is not found.
app.use('/lesson-images', express.static(path.join(__dirname,'public/images/lessons'))); // serve lesson images from 'images/lessons' directory.))

// Fallback route for handling 404 errors for lessons static files.
app.use('/lesson-images',(req, res) => {
    const now = new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'medium' });
    const logMessage = `[${now}] 404: Lesson image ${req.url} not found`;
    console.log(logMessage);

    // Append to log file
    fs.appendFile(logFile, logMessage, (err) => {
        if (err) console.error('Error writing to log file', err);
    });

    res.status(404).send({ error: `Lesson image ${req.url} was not found.` });
});

// Logger middleware that output all requests to the server console.
app.use((req, res, next) => {
    const now = new Date(); // store current date and time.
    const formattedDateTime = now.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'medium' }); // format date and time.

    const logMessage = `[${formattedDateTime}] ${req.method} ${req.url}\n`;
    console.log(logMessage.trim());

    // Append to log file
    fs.appendFile(logFile, logMessage, (err) => {
        if (err) console.error('Error writing to log file', err);
    });
    next();
});

// Middleware to check DB connection for /collections routes.
app.use('/collections', (req,res,next) => {
    if(!db1){
        console.log("Database not connected.");
        return res.status(500).send({message:" Database not connected. Please try again later."});
    }
    console.log("Database connected.");
    next();
});

// Attach collection to req
app.param('collectionName', (req, res, next, collectionName) => {
    try {
        req.collection = db1.collection(collectionName);
        next();
    } catch (err) {
        next(err);
    }
});

// GET all documents
app.get('/collections/:collectionName', async (req, res) => {
    try {
        const docs = await req.collection.find({}).toArray();
        res.json(docs);
    } catch (err) {
        console.error("Error fetching collection:", err);
        res.status(500).send("Error fetching data");
    }
});

// POST to place an order.
app.post('/checkout/place-order', async (req, res) => {
    try {
        // Validate order data.
        const validatedOrder = await orderSchema.validateAsync(req.body, {abortEarly: false});

        const result = await db1.collection("orders").insertOne(validatedOrder);
        
        res.status(201).send({
            message: "Order placed successfully",
            orderId: result.insertedId
        });
    } catch(err){
        if(err.isJoi){
            const errorMessages = err.details.map(details => details.message);
            console.log("Order validation errors:", errorMessages);
            return res.status(400).json({message: "Invalid order data", errors: errorMessages});
        }
        console.error("Error placing order:", err);
        res.status(500).send({message: "Error placing order. Please try again later."});
    }
});

// Get lesson item(s) by search query.
app.get('/lessons/search', async (req, res) => {
    const searchValue = req.query.keyword;

    if (!searchValue) {
        // return default all items if no search parameter provided.
        return res.status(400).json({ message: "Missing search parameter" });
    }

    // Check search value field type.
    let numericSearchValue = Number(searchValue); // Numeric value check

    const textFields = ["description","subject","location"];
    const numberFields = ["price", "available"];
    const textRegex = { $regex: searchValue, $options: "i"};
    
    let filters = [];

    // Add text search fields.
    filters.push(...textFields.map(field=> ({ [field] : textRegex})));

    // Add number search fields. (No regex for number fields).
    filters.push(...numberFields.map(field => ({ [field]: numericSearchValue })))

    // Create the filter query.
    const filterQuery = { $or: filters};

    try {
        let lessonSearchDb = db1.collection("lessons");
        const lessons = await lessonSearchDb.find(filterQuery).toArray();
        res.json(lessons);
    } catch (err) {
        res.status(500).json({ message: "Search error", error: err.message });
    }
});

// Get item by ID
app.get('/collections/:collectionName/:id',async(req,res)=>{
    const id= req.params.id;

    try{        
        const item =  await req.collection.findOne({_id: new ObjectId(id)})

        // if item not found
        if(!item){
            return res.status(404).json({message: "Item not found"});
        }

        // return the item
        res.json(item);
    } catch(err){
        console.error("Error fetching item by ID:", err);
        res.status(500).send({message: "Error fetching item"});
    }
});

// Update item by ID.
app.put('/collections/:collectionName/:id', async (req, res) => {
    const id = req.params.id;
    const updatedData = req.body;
    
    if(!updatedData){             
        return res.status(400).json({message: "Attribute name to update is required"});
    }

    try{
        const result = await req.collection.updateOne(
            {_id: new ObjectId(id)},
            { $set: updatedData }
        );

        if (result.matchedCount === 0) return res.status(404).json({message: "Lesson was not found."});
        res.json({message: "Lesson updated successfully."});
    } catch(err){
        console.error("Error updating item:", err); 
        res.status(500).send({message: "Error updating lesson."});
    }
})

