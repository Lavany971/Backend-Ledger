const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');



const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required for creating an user'],
        trim: true, //to remove any leading or trailing whitespace from the email string before saving it to the database
        lowercase: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Please provide a valid email address"],//regex pattern to validate email format
        unique: [true, 'Email already exists'],
    },
    name: {
        type: String,
        required: [true, 'Name is required for creating an account'],
    },
    password: {
        type: String,
        required: [true, 'Password is required for creating an account'],
        minlength: [6, "Password must be at least 6 characters long"],
        select: false, //to exclude the password field from query results by default for security reasons
    },
    systemUser: {
        type: Boolean,
        default: false,
        select: false,
    }
}, {
    timestamps: true,  //user createdAt and updatedAt fields will be automatically added and managed by Mongoose
})

userSchema.pre("save", async function (next) {  //pre-save middleware function that runs before saving a user document to the database
    if (!this.isModified("password")) { //to check if the password field has been modified. If it hasn't been modified, the middleware will skip hashing and proceed to the next middleware or save operation
        return;
    }
    const hash = await bcrypt.hash(this.password, 10); //to hash the password using bcrypt with a salt round of 10. The hashed password is then stored in the database instead of the plain text password for security reasons
    this.password = hash; //to replace the plain text password with the hashed password before saving it to the database
    return;
})

userSchema.methods.comparePassword = async function (password) { //to compare a candidate password with the hashed password stored in the database. This method is used during user authentication to verify if the provided password matches the stored password
    return await bcrypt.compare(password, this.password); //to compare the candidate password with the hashed password using bcrypt's compare function. It returns true if the passwords match and false otherwise
}


const userModel = mongoose.model("User", userSchema);

module.exports = userModel;