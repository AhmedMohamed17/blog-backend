const jwt =require('jsonwebtoken');

const HttpError = require("../models/errorModel");

// Middleware to protect routes
const authMiddleware = (req,res,next)=>{
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return next (new HttpError("Authorization token missing or invalid",401))
    }
    const token = authHeader.split(" ")[1];
    try{
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        req.user = decoded; // Attach user info to request object
        next();
    }catch(err){
        return next (new HttpError("Invalid or expired token",401))
    }
}
module.exports = authMiddleware;