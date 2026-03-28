import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 6,
  },
  role: {
    type: String,
    enum: ["farmer", "buyer", "transporter", "admin"],
    required: [true, "Role is required"],
  },
  phone: {
    type: String,
    trim: true,
  },
  location: {
    state: { type: String, trim: true },
    district: { type: String, trim: true },
    taluka: { type: String },
    village: { type: String },
    pincode: { type: String },
  },
  refreshToken: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  farmSize: { type: Number },
  farmingType: { type: String, enum: ["organic", "conventional", "mixed"] },
  isVerified: { type: Boolean, default: false },
  verifiedAt: { type: Date },
  completedOrders: { type: Number, default: 0 },
  businessName: { type: String },
  businessType: {
    type: String,
    enum: ["restaurant", "retailer", "wholesaler", "exporter", "other"],
  },
  gstNumber: { type: String },
  deliveryAddress: { type: String },
  fcmToken: { type: String },
})

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return
  this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

userSchema.methods.checkVerification = async function () {
  if (this.role === "farmer" && this.completedOrders >= 3 && !this.isVerified) {
    this.isVerified = true
    this.verifiedAt = new Date()
    await this.save()
  }
}

userSchema.methods.toJSON = function () {
  const user = this.toObject()
  delete user.password
  return user
}

const User = mongoose.model("User", userSchema)

export { User }

