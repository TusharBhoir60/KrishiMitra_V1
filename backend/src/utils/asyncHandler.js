// Main: async error wrapper for route handlers.
//higher order function (now u dont need to repeat try catch again and again)

const asyncHandler = (requestHandler) => {
    return (req,res,next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => {
            next(err)
        })
    }
}

export {asyncHandler}