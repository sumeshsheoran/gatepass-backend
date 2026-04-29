const express = require('express');
const { getUsers, getUser, createUser, updateUser, searchHosts } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const router = express.Router();

router.use(protect);

router.get('/hosts/search', authorize('guard'), searchHosts);
router.get('/', authorize('admin', 'superAdmin'), getUsers);
router.get('/:id', authorize('admin', 'superAdmin'), getUser);
router.post('/', authorize('admin', 'superAdmin'), createUser);
router.patch('/:id', authorize('admin', 'superAdmin'), updateUser);

module.exports = router;
