import mongoose, {Schema} from "mongoose";

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
    fullname: {
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
        type: Schema.Types.ObjctId,
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


export const User = mongoose.model("User", userSchema);
