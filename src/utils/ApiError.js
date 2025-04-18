class ApiError extends Error{
    constructor(
        statusCode,                           //HTTP status code (e.g., 404, 500)
        message = "Something went wrong",     //Optional message (defaults to "Something went wrong")
        errors = [],                          //array to store extra error details
        stack = ""                            //stack trace
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors

        if(stack){
            this.stack = stack
        }else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {ApiError}