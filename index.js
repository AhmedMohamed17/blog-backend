const express = require('express')
const cors = require('cors')
const {connect} = require('mongoose')
require('dotenv').config()
const upload = require('express-fileupload');
const userRoutes = require('./routes/postRoutes')
const postRoutes = require('./routes/userRoutes')
const { notfound ,errorHandler } = require('./middleware/errorMiddleware.js')
const app = express()
const port = 5000;

app.use(express.json({extended:true}));
app.use(express.urlencoded({extended:true}));
app.use(cors({credentials:true,origin:"http://localhost:3000"}));
app.use(upload());
app.use('/uploads',express.static(__dirname +'/uploads'))

connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log("err = ",err))
app.use('/api/posts',userRoutes)
app.use('/api/users',postRoutes)
app.use(notfound)
app.use(errorHandler)

app.listen(port, () => console.log(`Example app listening on port ${port}!`))