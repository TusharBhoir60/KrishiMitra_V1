// Main: consistent success response shape.
class ApiResponse {
    constructor(statusCode, data, message = "Success"){
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400   // 400 and above gives error 
    }
}

export { ApiResponse }