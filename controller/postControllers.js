const Post = require('../models/postModel.js');
const User = require('../models/userModel.js');
const path = require('path');
const fs = require('fs');
const  {v4:uuid} = require('uuid');
const HttpError = require("../models/errorModel");
const { log } = require('console');


// ===================== CREATE Post =====================//
// POST : api/posts
// PROTECTED ROUTE

const  createpost = async (req,res,next)=>{
   
    try {
        const {title,description,category} = req.body;
        if(!title || !category || !description || !req.files){
            return next (new HttpError("Please provide all required fields",422))
        }
        const {thumbnail} = req.files;
        if (thumbnail.size >2000000){
            return next (new HttpError("File size exceeds 2MB limit",422));
        }
        let fileName =thumbnail.name;
        let splittedFilename = fileName.split('.');
        let newFilename = splittedFilename[0]+uuid()+"."+splittedFilename[splittedFilename.length-1];
        thumbnail.mv(path.join(__dirname,'..','uploads',newFilename),async(err)=>{
            if(err){
                return next(new HttpError(err))
            }
            else {
                const newPost =await Post.create({title ,category , description , thumbnail:newFilename ,creator:req.user.id})
                if(!newPost){
                    return next (new HttpError(" Post could't be created"),422)
                }
                // find user and interact post count by 1
                const currentUser = await User.findById(req.user.id);
                const userPostCount =currentUser.posts+1;
                await User.findByIdAndUpdate(req.user.id,{posts:userPostCount});
                res.status(201).json(newPost)

            }
        })


    }
    catch(err){ 
        return next (new HttpError("Creating post failed. Please try again",500))
    }

}


// ===================== GET Posts =====================//
// GET : api/posts
// UNPROTECTED ROUTE

const  getPosts = async (req,res,next)=>{
      
    try{
        const Posts = await Post.find().sort({createdAt:-1});
       res.status(200).json(Posts);
    }
    catch(err){
        return next (new HttpError("Fetching posts failed. Please try again",500))  
    }
}

// ===================== GET single post =====================//
// GET : api/posts/:id
// UNPROTECTED ROUTE

const  getPost = async (req,res,next)=>{
  try {
       const postId = req.params.id;
       const post = await Post.findById(postId);
       if(!post){
        return next (new HttpError("Post not found",404))  
       }
       res.status(200).json(post);
  }
   catch(err){
    return next (new HttpError("Fetching post failed. Please try again",500))
   }
}

// ===================== GET posts by category =====================//
// GET : api/posts/categories/:category
// UNPROTECTED ROUTE

const  getCatPost = async (req,res,next)=>{
    try {
        const category = req.params.category;
        const catPosts = await Post.find({category}).sort({createdAt:-1});
        res.status(200).json(catPosts);
    }
    catch(err){
        return next (new HttpError("Fetching posts failed. Please try again",500))  
    }
} 

// ===================== Get Author POST =====================//
// GET : api/posts/users/:id
// UNPROTECTED ROUTE

const  getUserPosts = async (req,res,next)=>{
   try{
    const userId = req.params.id;
    const userPosts = await Post.find({creator:userId}).sort({createdAt:-1});
    res.status(200).json(userPosts);

   }
   catch(err){
    return next (new HttpError("Fetching posts failed. Please try again",500))
   }
} 

// ===================== Edit post =====================//
// patch : api/posts/:id
// PROTECTED ROUTE

const  editPost = async (req,res,next)=>{
    
   
    try { 
   let fileName;
   let newfileName;
   let updatedPost;
   const postId = req.params.id;
   let {title,description,category} = req.body;
   console.log(req.body);
     // react quill editor sends description as string with html tags
   if(!title || !category || description.length < 12){
    return next (new HttpError("Please provide all required fields",422))
   }
   if (!req.files){
    updatedPost = await Post.findByIdAndUpdate(postId,{title,description,category},{new:true});
   
   }
   else 
    {
    // get old posts from database
    const oldPost = await Post.findById(postId);
    console.log("oldPost", oldPost);
     console.log("req.user.id" , req.user.id);
            console.log("oldPost.creator" , oldPost.creator.toString());

if (!oldPost) {
            return next(new HttpError("Post not found.", 404));
        }
    // check if the logged in user is the creator of the post
        if (req.user.id !== oldPost.creator.toString()) {
           
            
            return next(new HttpError("Unautherized! You can only edit your own posts.", 403));
        }

    fs.unlink(path.join(__dirname,'..','uploads',oldPost.thumbnail), async(err)=>{
        if(err){
        return next (new HttpError(err))    
        }
        })
        // upload new thumbnail
        const {thumbnail} = req.files;
        if (thumbnail.size >2000000){
            return next (new HttpError("File size exceeds 2MB limit",422));
        }
            fileName =thumbnail.name;
            let splittedFilename = fileName.split('.');
            newfileName = splittedFilename[0]+uuid()+"."+splittedFilename[splittedFilename.length-1];
            thumbnail.mv(path.join(__dirname,'..','uploads',newfileName),async(err)=>{
                if(err){
                    return next(new HttpError(err))
                }
            })
        updatedPost = await Post.findByIdAndUpdate(postId,{title,description,category,thumbnail:newfileName},{new:true});
   }
    if(!updatedPost){
        return next (new HttpError(" Post could't be updated"),422)
    }
    res.status(200).json(updatedPost);
}
    catch(err){
        return next (new HttpError("Editing post failed. Please try again",500))    
    }
} 

// ===================== Delete post =====================//
// patch : api/posts/:id
// PROTECTED ROUTE

const  deletePost = async (req,res,next)=>{
   try{
    const postId = req.params.id;
    if(!postId){
        return next (new HttpError("Post ID is required",422))
    }
    const post =await Post.findById(postId);
    const fileName = post?.thumbnail;
    fs.unlink(path.join(__dirname,'..','uploads',fileName),async(err)=>{
        if(err){
            return next (new HttpError("Deleting post thumbnail failed. Please try again",500))
        }
        else {
            await Post.findByIdAndDelete(postId);
            const currentUser = await User.findById(req.user.id);
            const userPostCount =currentUser.posts - 1;
           await User.findByIdAndUpdate(req.user.id,{posts:userPostCount});
            res.status(200).json({message:"Post deleted successfully"});
        }
   })


}
   catch(err){
    return next (new HttpError("Deleting post failed. Please try again",500))
   }
    
} 


module.exports = {createpost,getPosts,getPost,getCatPost,getUserPosts,editPost,deletePost};