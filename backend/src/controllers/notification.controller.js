const { prisma } = require('../config/db');
const { createNotificationForAdmins } = require('../services/notification.service');

// @desc    Get admin notifications
// @route   GET /api/v1/notifications
// @access  Private/Admin
exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user.id,
        archived: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('GET NOTIFICATIONS ERROR:', error.stack);
    next(error);
  }
};

// @desc    Create a notification
// @route   POST /api/v1/notifications
// @access  Private/Admin
exports.createNotification = async (req, res, next) => {
  try {
    const { category, priority, title, description } = req.body;

    const notifications = await createNotificationForAdmins({
      category: category || 'system',
      priority: priority || 'medium',
      title,
      description
    });

    res.status(201).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('CREATE NOTIFICATION ERROR:', error.stack);
    next(error);
  }
};

// @desc    Update notification
// @route   PATCH /api/v1/notifications/:id
// @access  Private/Admin
exports.updateNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { read, pinned, archived } = req.body;

    const data = {};

    if (typeof read === 'boolean') {
      data.read = read;
    }

    if (typeof pinned === 'boolean') {
      data.pinned = pinned;
    }

    if (typeof archived === 'boolean') {
      data.archived = archived;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid notification fields provided'
      });
    }

    const existingNotification = await prisma.notification.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!existingNotification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    const notification = await prisma.notification.update({
      where: {
        id
      },
      data
    });

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('UPDATE NOTIFICATION ERROR:', error.stack);
    next(error);
  }
};

// @desc    Delete notification
// @route   DELETE /api/v1/notifications/:id
// @access  Private/Admin
exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingNotification = await prisma.notification.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!existingNotification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await prisma.notification.delete({
      where: {
        id
      }
    });

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('DELETE NOTIFICATION ERROR:', error.stack);
    next(error);
  }
};