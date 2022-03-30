const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    title: {
        type: String,
        required: 'Title is required',
        enum: ["Mr", "Mrs", "Miss"],
        trim: true
    },
    name: {
        type: String,
        required:  'Name is required',
        trim: true
    },
    phone: {
        type: String,
        required: 'Phone is required',
        unique: true,
        trim: true,
       

    },
    email: {
        type: String,
        unique: true,
        trim: true,
        required: 'Email is required',
        
    },
    password: {
        type: String,
        required: 'Password is required',
        trim: true,
        minlength: 8,
        maxlength: 15,
    },
    address: {
        street:{type:String, trim:true},
        city: {type:String, trim:true},
        pincode: {type:String, trim:true}
        
    }

}, { timestamps: true });

module.exports = mongoose.model('bookManagementProject_user', userSchema);