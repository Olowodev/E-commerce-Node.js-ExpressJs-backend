const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        email:{type: String, required: true, index: true, unique: true},
        firstname:{ type: String , required: true},
        lastname:{ type: String , required: true},
        password: {type: String, required: true},
        profileImg: {type: String },
        isAdmin: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true}
);

module.exports = mongoose.model('User', UserSchema)