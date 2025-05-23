import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../modles/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"


//create a methode for access and refresh tokens because it will be used at many places

const generateAccessAndRefreshTokens = async (userId) =>{
  try {
      const user = await User.findById(userId)
      const accessToken = await user.generateAccessToken()
      const refreshToken = await user.generateRefreshToken()

     user.refreshToken =  refreshToken    //storing new refresh token in the user documents
     await user.save({validateBeforeSave : false})  //remove validation of the schema like password etc while saving new refresh token

     return {accessToken, refreshToken}
      
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating access and refresh tokens")
  }
}


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
  // console.log("email :", email);
  // console.log(fullName);
  // console.log(username);

  //check validations here

  //first check for empty fields
  if (!fullName || !username || !email || !password) {
    throw new ApiError(400, "all fields are required");
  }

  //check for existing user
  const existedUser = await User.findOne({
    //findOne() retrieves a single matching document from the database.
    $or: [{ username }, { email }], //$or used for multiple fields check  otherwise use simply User.findOne(username)
  });

  if (existedUser) {
    throw new ApiError(
      408, " User with the username or email is already exists"
    );
  }

  // check for images , check for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path; // optional chaining (?.) to safely access the uploaded avatar file's path without throwing an error if something is missing.
  // const coverImageLocalPath = req.files?.coverImage[0]?.path; //[0] – Accesses the first file (assuming single file upload).

  //classical js instead pf optional chaining

  //  let coverImageLocalPath;: Declares a variable to store the path of the uploaded image.
  // req.files: Checks if any files were uploaded in the request.
  // Array.isArray(req.files.coverImage): Ensures that coverImage is an array (which it is when multiple files are uploaded under one field name).
  // req.files.coverImage.length > 0: Confirms at least one file was uploaded.
  // req.files.coverImage[0].path: Accesses the file path of the first uploaded image.
  // coverImageLocalPath = ...: Stores that path in the variable for later use (e.g., saving to DB or uploading to cloud).

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  //checking for avatar file
  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar field is required");
  }

  // upload them to cloudinary, avatar

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  //console.log(coverImage);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }
  // console.log(avatar);

  // create user object - entry in db.  after all validations check create the object
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "", //coverImage compulsorily check ni kiya isliye ho v skta h or nhi v agr hoga to (?.) url dedo nhi h to empty chhod do
    email,
    password,
    username: username.toLowerCase(),
  });

  // check for user creation
  const createdUser = await User.findById(user._id).select(
    //.select("-password -refreshToken"): This excludes the password and refreshToken fields from the returned result.
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // return response

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user registered successfully"));
});


const loginUser = asyncHandler(async (req, res) => {
  // req.body take data 
  // login with username or email 
  // find the user
  // if user found check the password otherwise throw error "user with username or email not exits please register"
  // generate acccess and refresh token
  // send tokens in cookies

  const {username, email, password} = req.body  //req {data} from body
  
  if (!(username || email)){            //checking email or password entered or not
    throw new ApiError(400, "username or email is required") 
  }

  const user = await User.findOne({     //finding email or password
    $or: [{username} , {email}]  
})

  if(!user){
    throw new ApiError(404, "user does not exists")
  }
    
 const isPasswordValid = await user.isPasswordCorrect(password)  //checking for password is correct or not taking isPasswordCorrect method from user.model.js 

 if(!isPasswordValid){
  throw new ApiError(401, "Invalid user Credentials")  
 }

 const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

 const loggedInUser =  await User.findById(user._id).select("-password -refreshToken") //dont want to return password and refresh token to the user

 const options = {    
    httpOnly : true,
    secure : true
 }

  return res
  .status(200)
  .cookie("accessToken" , accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(200,
      {
        user : loggedInUser, accessToken, refreshToken
      },
      "User loggedIn successfully"
    )
  ) 
  })


// This logout handler does three key things:

// Step	Action	Why
// 1️⃣	Deletes refresh token from DB	Prevents reusing the token for new sessions
// 2️⃣	Clears cookies	Removes tokens stored on the client
// 3️⃣	Sends 200 response	Confirms logout success

const logoutUser =  asyncHandler(async(req, res) => {
   await User.findByIdAndUpdate(
      req.user._id,
      {                    //“Find the user in the database using their ID. Remove (unset) their refreshToken field. Then, give me the updated user document.”
        $set: {
        refreshToken : undefined
        }
      },
        {
          new: true
        }
    )
    const options = {    
    httpOnly : true,
    secure : true
 }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json({
      success: true,
      message: "User logged out"
    });
})

const refreshAccessToken = asyncHandler(async(res,res) => {
        
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if(!refreshAccessToken){
    throw new ApiError(401, "Unauthorizes Request")
  }

  //two fields are required to verify 1st is token, 2nd is secreOfToken
 try {
   const decodedToken = jwt.verify(
     incomingRefreshToken,
     process.env.RERESH_TOKEN_SECRET
   )
 
   const user = await User.findById(decodedToken?._id)
 
   if(!user){
     throw new ApiError(401, "Invalid refresh token")
   }
    
   //checking the user's refresh token is matching with DB user's refresh token or not for renewal of access token
   if(incomingRefreshToken !== user?.refreshToken){
     throw new ApiError(401, "refresh token is expired or used")
   }
 
   const options={
    httpOnly : true,
    secure :  true
   }
 
   //destructure for giving new accessToken to the user 
  const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id) 
   return res
   .status(200)
   .cookie("accessToken", accessToken ,options)
   .cookie("refreshToken", newRefreshToken, options)
   .json(
     200,
     { accessToken, refreshToken : newRefreshToken},
       "access token refreshed successfully"
   )
 
 } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
 }
})

const changeUserPassword = asyncHandler(async(req, res) => {
  const {oldPassword, newPassword} = req.body     //this line ectract the oldPassword and newPassword from the body or http header etc

  const user =  await User.findById(req.user?._id)   //user is changing the password only if user already exists so use findById method

 const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

 if(!isPasswordCorrect){
  throw new ApiError(400, "Invalid old Password")
 }

 //if oldPassword is correct then set newPassword

  user.password = newPassword
  await user.save({validateBeforeSave :  false})

  return res
  .status(200)
  .json(
    new ApiResponse(200, {} , "Password changed successfully")
  )

})

const getCurrentUser = asyncHandler(async(req, res) => {
  return res
  .status(200)
  .json(200, req.user, "current user fetched successfully")   //in auth middleware we inject the whole user in req.user
}) 

const updateAccountDetails =  asyncHandler(async(req, res) => {
  const{fullName, email} = req.body           //const{} = req.body   req.body se jo field lena hoga wo { isme le lenge}

  //best practices- if user want to change any file then write the separate controller code , so the user text data do not need to update only  file gets updated
   if(!fullName || !email){
    throw new ApiError(400, "All fields are required")
   }

   const user = await User.findByIdAndUpdate(  //User.findByIdAndUpdate(...) Mongoose method to find a document by its _id and update it in one step.
    req.user?._id,   //this is the user logged in
    {
      $set: {     //$set is a MongoDB operator used to update specific fields in a document.
        fullName,
        email
      }
    },
    {
      new: true      // return the updated document instead of the old one
    }
  ).select("-password")  //we dont wnat to return password

  return res
  .status(200)
  .json(new ApiResponse(200, user,  "Account details updated successfully"))

})

const updateUserAvatar =  asyncHandler(async(req, res) => {
   const avatarLocalPath =  req.file?.path     //taking path from req.file  we required only one file avatar so we are using file instead of files

   if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing")
   }

  const avatar = await uploadOnCloudinary(avatarLocalPath)   //upload new avatar on cloudinary

  if(!avatar.url){
    throw new ApiError(400, "Error while uploading on Avatar")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id, 
    {
      $set : {
        avatar: avatar.url       //updating avatar file in DB
      }
    },
      {
        new : true             //returns new file
      }
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200, user, "Avatar updated successfully"))
})

const updateCoverImage =  asyncHandler(async(req, res) => {
  const coverImageLocalPath = req.file.path

  if (!coverImageLocalPath) {
    throw new ApiError(400, "cover Image file is missing")
  }
  
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  
  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploadig coverImage on Cloudinary")
  }
   
  const user = await User.findByIdAndUpdate(
    req.file?._id,
    {
      $set : {
        coverImage : coverImage.url
      }
    },
    {
      new : true
    }
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200, user, "coverImage updated successfully"))

})


export {
   registerUser ,
   loginUser, logoutUser,
   refreshAccessToken, 
   changeUserPassword , 
   getCurrentUser,
   updateAccountDetails,
   updateUserAvatar,
   updateCoverImage
  }

//controllers and routes can be import in index.js but we want to clean index.js , so we will import in app.js
