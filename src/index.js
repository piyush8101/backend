import connectDB from "./db/index.js";
import dotenv from 'dotenv';
import { app } from "./app.js";
dotenv.config();


connectDB()
.then(() =>{
    app.listen(process.env.PORT || 3000 ,() =>{
        console.log(`Server is running at port: ${process.env.PORT}`);        
    })
})
.catch((error) => {
    console.log("MONGODB connection failed !!", error);
    
} )































/*
//now import express also
import mongoose from 'mongoose'
import { DB_NAME } from './constants'   

import express from 'express'    //basic express js
const app = express()

 ( async () => {              //first use IIFE function with async then aplly try and catch
    try{
      await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)   //DB connecting in try    
    
    app.on("error", (error) =>{             //if not connecting with the app then throw error
        console.log("ERROR:" ,error)
        throw error
    })   
    app.listen(process.env.PORT, () =>{                   //basic express js
        console.log(`App is listening on Port ${process.env.PORT}`);
        
    })  
    }
    catch(error){
        console.error("ERROR:" ,error)            //throw error if any error occured with mongoose connect
        throw error
    }
 })()
    */






/*

//this is first method to connect database
import mongoose from 'mongoose'
import { DB_NAME } from './constants'   

 ( async () => {              //first use IIFE function with async then aplly try and catch
    try{
      await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)   //DB connecting in try    
    }
    catch(error){
        console.error("ERROR:" ,error)            //throw error if any error occured with mongoose connect
        throw error
    }
 })()

 */