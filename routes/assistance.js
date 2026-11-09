const express = require('express');
const router = express.Router();
const { db } = require('../db');

// Allowed enums per Prisma schema
const VALID_REQUEST_TYPES = [
  'NURSE_CALL',
  'DRINKING_WATER',
  'HELP_OUT_OF_BED',
  'GENERAL_ASSISTANCE',
  'OTHER',
];

const VALID_STATUSES = ['PENDING', 'IN_PROGRESS', 'RESOLVED'];

/**
 * GET /api/assistance/beds
 * Helper route to list all configured beds (useful for nurse overview & testing QR cards)
 */
router.get('/beds', async (req, res) => {
  try {
    const beds = await db.getAllBeds();
    return res.status(200).json({
      success: true,
      count: beds.length,
      data: beds,
    });
  } catch (error) {
    console.error('Error fetching all beds:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve beds list',
      error: error.message,
    });
  }
});

/**
 * GET /api/assistance/bed/:qrToken
 * Fetch bed details using its secure QR token
 */
router.get('/bed/:qrToken', async (req, res) => {
  try {
    const { qrToken } = req.params;

    if (!qrToken || typeof qrToken !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A valid QR token parameter is required.',
      });
    }

    const bed = await db.getBedByQrToken(qrToken.trim());

    if (!bed) {
      return res.status(404).json({
        success: false,
        message: `Bed not found for QR token: ${qrToken}. Please verify the QR code.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: bed,
    });
  } catch (error) {
    console.error('Error fetching bed by qrToken:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while resolving bed QR token',
      error: error.message,
    });
  }
});

/**
 * POST /api/assistance/request
 * Create a new assistance request for a bed and return it with bed details
 * Body: { bedId: string, requestType: string, customNote?: string }
 */
router.post('/request', async (req, res) => {
  try {
    const { bedId, requestType, customNote } = req.body;

    if (!bedId) {
      return res.status(400).json({
        success: false,
        message: 'bedId is required to submit an assistance request.',
      });
    }

    if (!requestType || !VALID_REQUEST_TYPES.includes(requestType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid or missing requestType. Must be one of: ${VALID_REQUEST_TYPES.join(', ')}`,
      });
    }

    // Verify bed existence
    const bed = await db.getBedById(bedId);
    if (!bed) {
      return res.status(404).json({
        success: false,
        message: `Bed with ID ${bedId} was not found.`,
      });
    }

    // Create request
    const newRequest = await db.createAssistanceRequest({
      bedId,
      requestType,
      customNote,
    });

    return res.status(201).json({
      success: true,
      message: 'Assistance request successfully registered. A nurse will attend shortly.',
      data: newRequest,
    });
  } catch (error) {
    console.error('Error creating assistance request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create assistance request',
      error: error.message,
    });
  }
});

/**
 * GET /api/assistance/active
 * Fetch all active requests (where status is PENDING or IN_PROGRESS),
 * ordered by latest submission time (descending).
 */
router.get('/active', async (req, res) => {
  try {
    const activeRequests = await db.getActiveRequests();

    return res.status(200).json({
      success: true,
      count: activeRequests.length,
      data: activeRequests,
    });
  } catch (error) {
    console.error('Error fetching active requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch active assistance requests',
      error: error.message,
    });
  }
});

/**
 * GET /api/assistance/request/:id
 * Retrieve status & details of a single request (for real-time status polling on patient view)
 */
router.get('/request/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const requestItem = await db.getRequestById(id);

    if (!requestItem) {
      return res.status(404).json({
        success: false,
        message: `Assistance request with ID ${id} not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: requestItem,
    });
  } catch (error) {
    console.error('Error fetching request by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch assistance request details',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/assistance/request/:id/status
 * Update request status (e.g., set acknowledgedAt when transitioning to IN_PROGRESS,
 * or resolvedAt when transitioning to RESOLVED).
 * Body: { status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' }
 */
router.patch('/request/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    // Verify existing request
    const existing = await db.getRequestById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Assistance request with ID ${id} was not found.`,
      });
    }

    const updatedRequest = await db.updateRequestStatus(id, status);

    return res.status(200).json({
      success: true,
      message: `Request status successfully updated to ${status}`,
      data: updatedRequest,
    });
  } catch (error) {
    console.error('Error updating request status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update request status',
      error: error.message,
    });
  }
});

module.exports = router;

