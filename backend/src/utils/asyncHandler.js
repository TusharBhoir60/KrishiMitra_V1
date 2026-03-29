// Main: async error wrapper for route handlers.
// higher order function (now u dont need to repeat try catch again and again)

const asyncHandler = (requestHandler) => {
    return async (req, res, forward) => {
        try {
            await requestHandler(req, res, forward)

            // If handler is middleware-style (3 params), continue chain automatically.
            if (requestHandler.length >= 3 && typeof forward === 'function') {
                return forward()
            }
        } catch (err) {
            if (typeof forward === 'function') {
                return forward(err)
            }

            throw err
        }
    }
}

export {asyncHandler}