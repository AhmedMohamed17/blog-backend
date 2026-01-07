const {Router} = require('express');
const {createpost,getPosts,getPost,getCatPost,getUserPosts,editPost,deletePost} = require('../controller/postControllers.js');
const authMiddleware = require('../middleware/authMiddleware.js');
const router = Router();


router.post('/',authMiddleware,createpost);
router.get('/',getPosts);
router.get('/:id',getPost); // get single post
router.get('/categories/:category',getCatPost);
router.get('/users/:id',getUserPosts);
router.patch('/:id',authMiddleware,editPost);
router.delete('/:id',authMiddleware,deletePost);

module.exports = router;