import mongoose, {Schema} from "mongoose";
import bcrypt from 'bcrypt'
import jsonwebtoken from 'jsonwebtoken'

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true, //index true makes the searching very efficient and better option.
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String, //cloundinary url
      required: true,
    },
    coverImage: {
      type: String, //cloundinary url
    },
    watchHistory: [
      {
        //array of watch videos taking id of video
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"], //custom msg "password is required"
    },
    refreshToken: {
      type: String,
    },
  },
  { 
    timestamps: true,
  }
);

//before saving in db we will encrypt password
userSchema.pre("save" , async function (next) {       //using pre and used for it takes two parameter event and callback
    if(!this.isModified("password")) 
       return next()   //checking only if changing or saving password otherwise dont

        this.password = await bcrypt.hash(this.password , 10)  //10 is salt of rounds
        next();
})   


//we design the custom methods like userSchema.methods.methodName = function(){}

//checking the encrypted passsword and user password(string) matching or not. So we created a custom hook
userSchema.methods.isPasswordCorrect = async function (password) {    
    return await bcrypt.compare(password, this.password)        //comparing encrypted and string of password
}

userSchema.methods.generateAccessToken = async function(){
  return jwt.sign(
      {
       // Payload: includes _id, email, username, fullname — info the backend can use to verify the user.
         _id : this.id,
         email : this.email,
         username : this.username,
         fullname : this.fullName
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
         expiresIn : process.env.ACCESS_TOKEN_EXPIRY
      }
   )
}

userSchema.methods.generaterefreshToken = async function (){
   return jwt.sign(
      {
         _id : this.id
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
         expiresIn : process.env.REFRESH_TOKEN_EXPIRY
      }
   )
}


export const User = mongoose.model("User", userSchema);
