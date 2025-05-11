import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../modles/user.model.js";
import {uploadOnCloudinary} from  "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user is already exists
  // check for images , check for avatar
  // upload them to cloudinary, avatar
  // create user object - entry in db (no sql db stores as object mostly)
  // remove password and refresh token field from response (return unecncrypted pass to user )
  // check for user creation
  // return response

  const { username, password, email, fullName } = req.body;
  console.log("email :", email);

  //check validations here

  //first check for empty fields
  if (!fullName || !username || !email || !password) {
    throw new ApiError(400 ,"all fields are required");
  }

  //check for existing user
  const existedUser = User.findOne({     //findOne() retrieves a single matching document from the database.
    $or: [{ username }, { email }],     //$or used for multiple fields check  otherwise use simply User.findOne(username)
  });

  if (existedUser) {
    throw new ApiError(408, " User with the username or email is already exists");
  }
 
    // check for images , check for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path; // optional chaining (?.) to safely access the uploaded avatar file's path without throwing an error if something is missing.
  const coverImageLocalPath = req.files?.coverImahe[0]?.path; //[0] – Accesses the first file (assuming single file upload).

  if (!avatarLocalPath) {
   throw new ApiError(400, "avatar field is required")
  }   
   
    // upload them to cloudinary, avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)  
   
  if (!avatar) {
   throw new ApiError(400, "Avatar file is required")
  }

  // create user object - entry in db 
 const user = await User.create({
   fullName,
   avatar : avatar.url,
   coverImage : coverImage?.url || "" ,        //coverImage compulsorily check ni kiya isliye ho v skta h or nhi v agr hoga to (?.) url dedo nhi h to empty chhod do
   email,
   password,
   username : username.toLowerCase()  
})


      // check for user creation
    const createdUser = await User.findById(user._id).select(   //.select("-password -refreshToken"): This excludes the password and refreshToken fields from the returned result.
      "-password -refreshToken"
    )
     
    if(!createdUser){
      throw new ApiError(500, "Something went wrong while registering the user")
    }

      // return response

      return res.status(201).json(
         new ApiResponse(200, createdUser , "user registered successfully")
      )

});

export { registerUser };

//controllers and routes can be import in index.js but we want to clean index.js , so we will import in app.js
