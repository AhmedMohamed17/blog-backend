// unsupported (404) routes

const notfound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
}
//Middlewate to handle errors
const errorHandler = (error, req, res, next) => {
    if(res.headerSent){
        return next(error);
    }
    res.status(error.code || 500).json({message: error.message || "An unknown error occurred!"});
}
module.exports = {notfound,errorHandler};