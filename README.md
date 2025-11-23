# Fullstack-Coursework1-Year3-ExpressApp-M00978514
This is the backend repository of the XLearning website that allows buying after school classes and activities.

## Required links for the web app
1. GitHub Repository for the Vue.js App: https://github.com/bteena04/Fullstack-Coursework1-Year3-M00978514.git 
2. Link to the GitHub Pages: https://bteena04.github.io/Fullstack-Coursework1-Year3-M00978514
3. GitHub Repository for the Express.js App: https://github.com/bteena04/Fullstack-Coursework1-Year3-ExpressApp-M00978514.git
4. Link to render.com route that returns all lessons (Express.js App): https://fullstack-coursework1-year3-expressapp.onrender.com/collections/lessons 


## Project folder structure

The folder structure is as follows:
│Fullstack-Coursework1-Year3-ExpressApp-M00978514/
│
├─ config # database configuration
├─ helper 
├─ public # for static files
├─ .env
├─ .gitignore
├─ index.js
├─ package-lock.json
├─ package.json
├─ server.log
├─ README.md

## Setup instructions
1. Navigate to the backend folder (Fullstack-Coursework1-Year3-ExpressApp-M00978514).
2. Create a .env file with the following codes:
    PORT=3000
    MONGO_URI=<your-atlas-connection-string>
    FRONTEND_URL=<your-frontend-URL>
3. Install dependencies using the bash command: `npm install`.
    >Important!: Omitting the FRONTEND_URL from the .env file will cause the backend to block request from the frontend.
4. To start the server, run the bash command: `npm start`.
    >This should output a message 'Server is running on port 3000' to the console to indicate that the server is running correctly.

## Api Routes

### 1. Lesson routes:
- `GET /` - Get server status.
- `GET /collections` - All requests to the database are exposed under this path.
- `GET /collections/lessons` - Get all lessons.
- `GET /collections/lessons/:id` - Get a lesson by its ID.
- `PUT /collections/lessons/:id` - Update a lesson by its ID.

### 2. Order routes:
- `GET /collections/orders` - Get all orders.
- `POST /checkout/place-order` - Create a new order.

### 3. Search route:
- `GET /lessons/search` - Search lessons by description, subject, location, price, or available spaces.
>Example usage: `/lessons/search?keyword=maths`

### 4. Route for serving static files.
Static files such as images and stored in the public folder inside the images/lessons directory.
- `GET /lesson-images` - Serves lesson images from the public/images/lessons directory.
> Example Usage: lesson-images/maths.jpg. If images is not found, a 404 error response is returned.






