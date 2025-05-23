//https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj   model link

import mongoose, {Schema} from "mongoose";

const subscriptionSchema =  new Schema({
    subscriber : {
        type: Schema.Types.ObjectId,    //one who is subcribing the channel
        ref : "User"
    },
    channel : {
        type: Schema.Types.ObjectId,   //one to whom the subscribers is subscribing
        ref : "User"
    },
},   {
        timestamps
    })

export const Subscription = mongoose.model("Subscription", subscriptionSchema)

