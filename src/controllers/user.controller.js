import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../modles/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { use } from "react";


//create a methode for access and refresh tokens because it will be used at many places

const generateAccessAndRefreshTokens = async (userId) =>{
  try {
      const user = await User.findById(userId)
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()

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
    
 const isPasswordValid = user.isPasswordCorrect(password)  //checking for password is correct or not taking isPasswordCorrect method from user.model.js 

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
  .cookie("accessToken" , accessToken, httpOnly)
  .cookie("refreshToken", refreshToken, httpOnly)
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
    .json(200, {}, "User logged Out")
})
 
export { registerUser , loginUser, logoutUser};

//controllers and routes can be import in index.js but we want to clean index.js , so we will import in app.js
