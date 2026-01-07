const User = require("../models/userModel.js");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs =require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const HttpError = require("../models/errorModel");
//===================== Register A new User =====================//
// POST :api/users/register
const registerUser =async (req,res,next)=>{
    // un pprotected route
    try{
        const {name,email,password ,password2} = req.body;
        if(!name || !email || !password){
            return next(new HttpError("Please fill all the required fields",422))
        }
        const newEmail =email.toLowerCase();
        const emailExists = await User.findOne({email:newEmail});
        if(emailExists){
            return next (new HttpError("Email already registered. Please login",422))
        }
        if(password.trim().length <6){
            return next (new HttpError("Password must be at least 6 characters long",422))
        }
        if(password !== password2){
            return next (new HttpError("Passwords do not match",422))
        }
         const  salt =await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password,salt);
        const newUser = await User.create({name,email:newEmail,password:hashedPassword});
         res.status(201).json({message:"User registered successfully",newUser});
    }catch(err){
        return next (new HttpError("Registration failed. Please try again",500))
    }
}

//===================== Login A registered User =====================//
// POST :api/users/login
const loginUser =async (req,res,next)=>{
   try{
    const {email,password} = req.body;
    if(!email || !password){
        return next (new HttpError("Please provide email and password",422))
    }
     const newEmail = email.toLowerCase();
    const existingUser = await User.findOne({email:newEmail});
    // console.log("existingUser",existingUser);
    if(!existingUser){
        return next (new HttpError("Invalid credentials. Please try again",422))
    }
    const isPasswordCorrect = await bcrypt.compare(password,existingUser.password);
    if(!isPasswordCorrect){
        return next (new HttpError("Invalid credentials. Please try again",422))
    }  

    const {_id:id ,name} = existingUser;
    const token = jwt.sign({id,name},process.env.JWT_SECRET,{expiresIn:"1d"});
    res.status(200).json({message:"Login successful",token,id,name}); 
   }
   catch(err){
    return next (new HttpError("Login failed. Please try again",500))
   }
}

//===================== User Profile =====================//
// GET :api/users/:id
const getUser =async (req,res,next)=>{
    try{
        const {id} = req.params;
        const user = await User.findById(id).select('-password');
        if(!user){
            return next (new HttpError("User not found",404))
        }
        res.status(200).json({user});
    }
    catch(err){
        return next (new HttpError("Fetching user failed. Please try again",500))
    }

}



//===================== Change user Avatar (Profile picture) =====================//
// POST :api/users/change-avatar
const changeAvatar = async (req,res,next)=>{
   try{
       if(!req.files.avatar){
        return next (new HttpError("No avatar file uploaded",422));
       } 
       //find user from database
       const user =await User.findById(req.user.id);
       //delete old avatar if exists
       if(user.avatar){
        fs.unlink(path.join(__dirname,'..',user.avatar),(err)=>{
            if(err){
                return next (new HttpError("Deleting old avatar failed. Please try again",500))
            }
        });
       }

         const {avatar} = req.files;
         if(avatar.size> 500000){
         return next (new HttpError("Avatar size should be less than 500KB",422));
       }   
       let fileName ;
       fileName = avatar.name;
       let splittedFilename = fileName.split('.');
       let newFilename = splittedFilename[0] + '-' + uuidv4() + '.' + splittedFilename[splittedFilename.length -1];
       avatar.mv(path.join(__dirname,'..','uploads',newFilename),async(err)=>{
        if(err){
            return next (new HttpError("Uploading avatar failed. Please try again",500))
        }
        const updatedAvatar =await User.findByIdAndUpdate(req.user.id,{avatar:`uploads/${newFilename}`},{new:true})
        if(!updatedAvatar){
            return next (new HttpError("Updating avatar failed. Please try again",500))
        }
        res.status(200).json({message:"Avatar changed successfully",updatedAvatar});
    })
   }
  
   catch(err){
    return next (new HttpError("Changing avatar failed. Please try again",500))
   }
}

//===================== Edit User details (from profile) =====================//
// POST : api/users/edit-user
const editUser =async (req,res,next)=>{
    try{
        const {name,email,currentPassword,newPassword,newConfirmPassword} = req.body;
        console.log(req.body);
        if(!name || !email || !currentPassword || !newPassword){
         return next (new HttpError("Please fill all the required fields",422));
        }
        //get user from db
        const user = await User.findById(req.user.id);
        if(!user){
            return next (new HttpError("User not found",403));
        }
        //make sure new email is not taken by another user
        const emailExist = await User.findOne({email:email.toLowerCase()});
        if(emailExist && emailExist._id!== req.user.id){
        
         return next (new HttpError("Email already in use by another account",422));
        }
        // compare current password to db password
        const validatepassword = await bcrypt.compare(currentPassword,user.password);
       if(!validatepassword){
        return next (new HttpError("Current password is incorrect",422));
       }
        // compare new password and confirm new password
       if(newPassword !== newConfirmPassword){
        return next (new HttpError("the passwords is not match",422));
       } 
       //hash new password
         const salt = await bcrypt.genSalt(10);
         const Hash = await bcrypt.hash(newPassword,salt);
         // update user info in database
         const newInfo = await User.findByIdAndUpdate(req.user.id,{name,email,password:Hash},{new:true});
         res.status(200).json({message:"User details updated successfully",newInfo});
    }
    catch(err){
        return next (new HttpError("Updating user details failed. Please try again",500))
    }
}

//===================== GET Authors =====================//
// POST : api/users/edit-user
const getAuthors = async(req,res,next)=>{
   const authors = await User.find().select('-password');
   res.status(200).json(authors);
}

module.exports = {registerUser,loginUser,getUser,changeAvatar,getAuthors,editUser}