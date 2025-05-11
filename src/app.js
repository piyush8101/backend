import express from 'express';
import cors from 'cors'
import cookieParser from 'cookie-parser';

const app = express()

//app.use(cors())   //simple way to use corse
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials : true
}))

//cofiguring the express how app should handle incoming requests

/*r
app.use(express.json({limit: "16kb"}))    
app.use(express.urlencoded({nested: true, limit: "16kb"})) 
app.use(express.static("public"))    
app.use(cookieParser()) */

// Parses JSON in incoming requests (e.g., from fetch or axios)
app.use(express.json({ limit: "16kb" }));

// Parses URL-encoded form data (like from <form> submissions)
// 'extended: true' allows nested objects in the data
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Serves static files (HTML, CSS, JS, images, etc.) from a folder named 'public'
app.use(express.static("public"));

// Parses cookies from incoming requests and makes them accessible via req.cookies
app.use(cookieParser());



//import routes
import userRouter  from './routes/user.routes.js';

//routes declaration
app.use("/api/v1/users" ,userRouter)         //app.use("/users" ,userRouter)   writing api version better approach

// http://localhost:8000/api/v1/users/register
export {app}