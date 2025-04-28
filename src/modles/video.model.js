import mongoose,  {Schema} from "mongoose";
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'
import bcrypt from 'bcrypt'
import jsonwebtoken from 'jsonwebtoken'

const VideoSchema = new Schema(
    {
        videoFile  : {
           type : String,     //cloudinary url
           required  : true
        },
        thumbnail  : {
            type : String,     //cloudinary url
            required  : true
         },
         title : {
            type : String,     
            required  : true
         },
         description : {
            type : String,     
            required  : true
         },
         duration : {
            type : Number,     
            required  : true
         },
         views :  {
            type : Number,
            default : 0
         },
         isPublished : {
            type  : Boolean,
            default :  true
         },
         owner : {
            type :  Schema.Types.ObjectId,
            ref : "User"
         }     
},
{
    timestamps : true
}
)

//before saving in db we will encrypt password
userSchema.pre("save" , async function (next) {       //using pre and used for it takes two parameter event and callback
    if(!this.isModified("password"))  return next()   //checking only if changing or saving password otherwise dont

        this.password = bcrypt.hash(this.password , 10)  //10 is salt of rounds
        next()
})   

//checking the encrypted passsword and user password(string) matching or not. So we created a custom hook
userSchema.methods.isPasswordCorrect = async function (password) {    
    return await bcrypt.compare(password, this.password)        //comparing encrypted and string of password
}

userSchema.methods.generteAccessToken = async function(){
  return jwt.sign(
      {
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

export const Video = mongoose.model("Video", VideoSchema)