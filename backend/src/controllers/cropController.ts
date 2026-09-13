import { Response } from 'express';
import { prisma } from '../utils/db';
import { AuthRequest } from '../middleware/auth';

// Fetch all farms for the logged-in user
export const getFarms = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const farms = await prisma.farm.findMany({
      where: { userId },
      include: {
        fields: {
          include: {
            cropCycles: {
              where: { status: 'ACTIVE' },
            },
          },
        },
        devices: true,
      },
    });
    return res.json(farms);
  } catch (error) {
    console.error('Fetch farms error:', error);
    return res.status(500).json({ error: 'Server error retrieving farms.' });
  }
};

// Create a new farm for the logged-in user
export const createFarm = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, location } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Farm name is required.' });
    }

    const farm = await prisma.farm.create({
      data: {
        name: name.trim(),
        location: location?.trim() || 'Rural Zone',
        userId,
      },
    });

    return res.status(201).json(farm);
  } catch (error) {
    console.error('Create farm error:', error);
    return res.status(500).json({ error: 'Server error creating farm.' });
  }
};

// Create a new Field on a farm
export const createField = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, size, farmId, cropName } = req.body;

    if (!name || !size || !farmId) {
      return res.status(400).json({ error: 'Field Name, Size, and Farm ID are required.' });
    }

    // Verify farm ownership
    const farm = await prisma.farm.findFirst({
      where: { id: farmId, userId },
    });

    if (!farm) {
      return res.status(403).json({ error: 'Unauthorized access to this farm.' });
    }

    const field = await prisma.field.create({
      data: {
        name,
        size: parseFloat(size),
        farmId,
      },
    });

    if (cropName) {
      await prisma.cropCycle.create({
        data: {
          cropName,
          status: 'ACTIVE',
          fieldId: field.id,
        },
      });
    }

    const fullField = await prisma.field.findUnique({
      where: { id: field.id },
      include: { cropCycles: true },
    });

    return res.status(201).json(fullField);
  } catch (error) {
    console.error('Create field error:', error);
    return res.status(500).json({ error: 'Server error creating field.' });
  }
};

// Complete or Harvest an active Crop Cycle
export const harvestCropCycle = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'HARVESTED' or 'FAILED'
    const userId = req.user?.id;

    // Verify owner
    const cropCycle = await prisma.cropCycle.findFirst({
      where: {
        id,
        field: {
          farm: { userId },
        },
      },
    });

    if (!cropCycle) {
      return res.status(404).json({ error: 'Crop cycle not found or unauthorized.' });
    }

    const updated = await prisma.cropCycle.update({
      where: { id },
      data: {
        status: status || 'HARVESTED',
        endDate: new Date(),
      },
    });

    return res.json({
      message: `Crop cycle marked as ${updated.status}.`,
      cropCycle: updated,
    });
  } catch (error) {
    console.error('Harvest crop error:', error);
    return res.status(500).json({ error: 'Server error updating crop cycle.' });
  }
};
