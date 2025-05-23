import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../modles/user.model.js";

// This middleware:
// Extracts the JWT token from cookies or headers.
// Verifies it using your secret.
// Fetches the corresponding user from the database.
// Ensures the user is valid (not deleted or tampered).
// If everything is good, passes control to the next middleware or route.

export const verifyJWT = asyncHandler(async(req, res, next) => {
    //we get the authorization header in "Authorization: Bearer <access_token>" this format so we are using replace to remove "Bearer " and get only access_token
    try {
   
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")   
        
        if(!token){
            throw new ApiError(401, "Unauthorized access")
        }
    
        //verifying the header token to the actual token if it matches then user is successfully logged in otherwise throw error
       const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
       //search the decoded token user by _id in User documents and removing password and refreshToken to return
        const user = await User.findById(decodedToken?._id).
        select("-password -refreshToken")
    
        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }
         req.user = user    //✅ req.user = user makes the authenticated user’s info available to the rest of the app during that request — like a temporary, safe identity card.
           next()
    } catch (error) {
        console.error("JWT verification error:", error);
        throw new ApiError(error?.message || "Invalid Access Token")
    }
})