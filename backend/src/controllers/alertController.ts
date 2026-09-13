import { Response } from 'express';
import { prisma } from '../utils/db';
import { AuthRequest } from '../middleware/auth';

// Fetch all alerts for logged-in user's devices
export const getAlerts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const alerts = await prisma.alert.findMany({
      where: {
        device: {
          farm: { userId },
        },
      },
      include: {
        sensor: true,
        device: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(alerts);
  } catch (error) {
    console.error('Fetch alerts error:', error);
    return res.status(500).json({ error: 'Server error retrieving alerts.' });
  }
};

// Mark single alert as read
export const markAlertRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Verify ownership via device
    const alert = await prisma.alert.findFirst({
      where: {
        id,
        device: {
          farm: { userId },
        },
      },
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found or unauthorized.' });
    }

    const updated = await prisma.alert.update({
      where: { id },
      data: { isRead: true },
    });

    return res.json(updated);
  } catch (error) {
    console.error('Mark alert read error:', error);
    return res.status(500).json({ error: 'Server error updating alert status.' });
  }
};

// Fetch notifications
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(notifications);
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return res.status(500).json({ error: 'Server error retrieving notifications.' });
  }
};

// Mark single notification as read
export const markNotificationRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found or unauthorized.' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return res.json(updated);
  } catch (error) {
    console.error('Mark notification read error:', error);
    return res.status(500).json({ error: 'Server error updating notification status.' });
  }
};

// Clear/Delete all notifications
export const clearNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    await prisma.notification.deleteMany({
      where: { userId },
    });

    return res.json({ message: 'Notifications cleared successfully.' });
  } catch (error) {
    console.error('Clear notifications error:', error);
    return res.status(500).json({ error: 'Server error clearing notifications.' });
  }
};
