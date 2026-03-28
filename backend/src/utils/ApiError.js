// Main: consistent error shape for API responses.
class ApiError extends Error{    //uses error class 
    constructor(statusCode, 
        message = "Something went wrong" , 
        errors = [] , 
        stack = ""
    ){
        super(message)     //use message from error class 
        this.statusCode = statusCode
        this.message = message
        this.data = null
        this.success = false 
        this.errors = errors 

        if(stack){
            this.stack = stack
        }else{
            Error.captureStackTrace(this , this.constructor)
        }
    }
}

export { ApiError }