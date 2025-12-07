const mongoose = require('mongoose');

const userSchema  = new mongoose.Schema({
    userName:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    accessToken:{      
        type:String,
        required:true,
    },  
    refreshToken:{      
        type:String,
        required:false,
    },
    calendarId:{
        type:String,
        default:'primary',
    }
},{
    versionKey:false,
    timestamps:{
        createdAt:'created_at',
        updatedAt:'updated_at'
    }
});


const User = mongoose.model('User',userSchema);
module.exports = User;