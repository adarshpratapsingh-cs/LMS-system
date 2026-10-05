const { prisma } = require('../config/db');

const createNotificationForAdmins = async ({
  category,
  priority = 'medium',
  title,
  description
}) => {
  const admins = await prisma.user.findMany({
    where: {
      role: 'admin',
      id: {
        not: ''
      }
    },
    select: {
      id: true
    }
  });

  if (admins.length === 0) {
    return [];
  }

  const notifications = await prisma.notification.createManyAndReturn({
    data: admins.map((admin) => ({
      userId: admin.id,
      category,
      priority,
      title,
      description
    }))
  });

  return notifications;
};

module.exports = {
  createNotificationForAdmins
};
