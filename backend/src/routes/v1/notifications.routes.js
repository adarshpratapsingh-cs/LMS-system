const express = require('express');

const {
  getNotifications,
  createNotification,
  updateNotification,
  deleteNotification
} = require('../../controllers/notification.controller');

const {
  protect,
  authorize
} = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/', getNotifications);

router.post('/', createNotification);

router.patch('/:id', updateNotification);

router.delete('/:id', deleteNotification);

module.exports = router;