import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
      },
      password: {
        type: String,
        required: true
      },
      role: {
        type: String,
        enum: ["staff", "admin"],
        default: "staff"
      },
      assignedClients: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Client",
        default: []
      }
    });
    
    // Hash password before saving
    userSchema.pre("save", async function () {
      if (!this.isModified("password")) return;
      this.password = await bcrypt.hash(this.password, 10);
    });

    userSchema.methods.comparePassword = function (candidatePassword) {
        return bcrypt.compare(candidatePassword, this.password);
      };
    
    const User = mongoose.model("User", userSchema);
    export default User;