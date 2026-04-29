const express = require('express');
const { getCompanies, getCompany, createCompany, updateCompany, assignGuard, removeGuard } = require('../controllers/companyController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin', 'superAdmin', 'guard'), getCompanies);
router.get('/:id', authorize('admin', 'superAdmin', 'guard'), getCompany);
router.post('/', authorize('superAdmin'), createCompany);
router.patch('/:id', authorize('superAdmin'), updateCompany);
router.post('/:id/assign-guard', authorize('superAdmin'), assignGuard);
router.delete('/:id/remove-guard/:guardId', authorize('superAdmin'), removeGuard);

module.exports = router;
