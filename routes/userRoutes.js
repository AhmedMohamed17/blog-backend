const {Router} = require('express');
const {registerUser,loginUser,getUser,changeAvatar,getAuthors,editUser} = require('../controller/userControllers.js');
const authMiddleware = require('../middleware/authMiddleware.js');
const router = Router();

router.post('/register',registerUser)
router.post('/login',loginUser)
router.get('/:id',getUser)
router.post('/change-avatar',authMiddleware,changeAvatar)
router.get('/',getAuthors)
router.patch('/edit-user',authMiddleware,editUser)

module.exports = router;