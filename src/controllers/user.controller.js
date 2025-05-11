import {asyncHandler} from "../utils/asyncHandler.js"

const registerUser =  asyncHandler( async(req, res) => {
    res.status(200).json({
        message: "ok"
    })
})

export {registerUser}


//controllers and routes can be import in index.js but we want to clean index.js , so we will import in app.js