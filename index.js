const express = require('express')
const cors = require('cors')
const {connect} = require('mongoose')
require('dotenv').config()
const upload = require('express-fileupload');
const postRoutes = require('./routes/postRoutes')
const userRoutes = require('./routes/userRoutes')
const { notfound ,errorHandler } = require('./middleware/errorMiddleware.js')
const serverless = require('serverless-http');
const app = express()

const port = process.env.PORT || 5000;

app.use(express.json({extended:true}));
app.use(express.urlencoded({extended:true}));
app.use(cors({credentials:true, origin: process.env.CLIENT_URL || "http://localhost:3000" || "https://fullstack-frontend-lego.netlify.app/"}));
app.use(upload());
// Note: Vercel's filesystem is ephemeral. For persistent uploads use external storage (S3, Cloudinary, etc.).
app.use('/uploads',express.static(__dirname +'/uploads'))

connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log("err = ",err))
app.use('/api/posts',postRoutes)
app.use('/api/users',userRoutes)
app.use(notfound)
app.use(errorHandler)

// Only call listen when running locally (`node index.js`). On Vercel we'll export a serverless handler below.
if (require.main === module) {
  app.listen(port, () => console.log(`Example app listening on port ${port}!`))
}

module.exports = serverless(app);