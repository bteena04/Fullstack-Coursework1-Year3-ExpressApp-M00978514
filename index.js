// index.js
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const path = require("path");
const PropertiesReader = require("properties-reader");

const app = express();
app.use(cors());
app.use(express.json());
app.set('json spaces', 3);

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

let db1;

// -----------------------------
// Connect to MongoDB
async function connectDB() {
    try {
        await client.connect();
        db1 = client.db(dbName);
        console.log("Connected to MongoDB:", dbName);
    } catch (err) {
        console.error("MongoDB connection error:", err);
    }
}

connectDB();