import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import authRoutes from "./routes/authRoute.js"
import listingRoutes from "./routes/listing.routes.js"
import orderRoutes from "./routes/order.routes.js"
import notificationRoutes from "./routes/notificationRoutes.js"
import transporterRoutes from "./routes/transporterRoutes.js"
import deliveryRoutes from "./routes/deliveryRoutes.js"
import adminRoutes from "./routes/adminRoutes.js"
import aiRoutes from "./routes/aiRoutes.js"
import { errorHandler } from "./middlewares/errorHandler.js"
import ReviewRoutes from "./routes/reviewRoutes.js"

const app = express() 

//cors config -> allows frontend to run on different port/domain 
const allowedOrigins = (process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
    : [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ])

const localDevOriginRegex = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/

const corsOriginHandler = (origin, callback) => {
    // Allow non-browser tools (no Origin header) and explicit/dev localhost origins.
    if (!origin || allowedOrigins.includes(origin) || localDevOriginRegex.test(origin)) {
        return callback(null, true)
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`))
}

app.use(
    cors({
        origin: corsOriginHandler,
        credentials: true,
        optionsSuccessStatus: 204,
    })
)

//common middleware config 
app.use(express.json()) //parses incoming json data from req.body - supports larger payloads for profiles, images, etc.
app.use(express.urlencoded({extended: true})) //parses urlencoded data from forms - supports larger payloads for profiles, images, etc.
app.use(cookieParser())  //parses cookies sent by the client required to read jwt refresh tokens


app.use("/api/listings", listingRoutes) //register listing routes under /api/listings path
app.use("/api/crops", listingRoutes)
app.use("/api/orders", orderRoutes) //register order routes under /api/orders path
app.use("/api/auth", authRoutes) //register auth routes under /api/auth path
app.use("/api/notifications", notificationRoutes)
app.use("/api/transporter", transporterRoutes)
app.use("/api/transporters", transporterRoutes)
app.use("/api/delivery", deliveryRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/ai", aiRoutes)
app.use("/api/reviews", ReviewRoutes) //register review routes under /api/reviews path

app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, message: 'KrishiBazaar API running' })
})

app.use(errorHandler)

export { app }