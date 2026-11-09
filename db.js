const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

let prisma;
let isPrismaConnected = false;

// Pre-computed hash for demo password "NursePass123!"
const DEMO_PASSWORD_HASH = bcrypt.hashSync('NursePass123!', 10);

// In-memory fallback store if database is offline or not configured yet
const memoryStore = {
  nurses: [
    {
      id: 'nurse-uuid-001',
      name: 'Sarah Chen, RN',
      email: 'nurse@mediflow.com',
      employeeId: 'NURSE-101',
      passwordHash: DEMO_PASSWORD_HASH,
      department: 'Inpatient Care & ICU',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'nurse-uuid-002',
      name: 'David Rodriguez, BSN',
      email: 'david.rodriguez@mediflow.com',
      employeeId: 'NURSE-204',
      passwordHash: DEMO_PASSWORD_HASH,
      department: 'General Medical Ward',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  beds: [
    {
      id: 'bed-uuid-101-a',
      roomNumber: '101',
      bedNumber: 'Bed-A',
      qrToken: 'QR-ROOM101-BEDA',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'bed-uuid-101-b',
      roomNumber: '101',
      bedNumber: 'Bed-B',
      qrToken: 'QR-ROOM101-BEDB',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'bed-uuid-204-1',
      roomNumber: '204',
      bedNumber: 'Bed-1',
      qrToken: 'QR-ROOM204-BED1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'bed-uuid-icu3-2',
      roomNumber: 'ICU-3',
      bedNumber: 'Bed-2',
      qrToken: 'QR-ROOM-ICU3-BED2',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'bed-uuid-302-a',
      roomNumber: '302',
      bedNumber: 'Bed-A',
      qrToken: 'QR-ORTHO-302A',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'bed-uuid-wardb-4',
      roomNumber: 'Ward-B',
      bedNumber: 'Bed-04',
      qrToken: 'QR-WARDB-BED04',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  requests: [
    {
      id: 'req-init-1',
      bedId: 'bed-uuid-101-a',
      requestType: 'DRINKING_WATER',
      customNote: 'Needs warm water and a fresh tumbler',
      status: 'PENDING',
      submittedAt: new Date(Date.now() - 4 * 60 * 1000), // 4 mins ago
      acknowledgedAt: null,
      resolvedAt: null,
    },
    {
      id: 'req-init-2',
      bedId: 'bed-uuid-icu3-2',
      requestType: 'NURSE_CALL',
      customNote: 'Patient feeling mild dizziness after turning',
      status: 'IN_PROGRESS',
      submittedAt: new Date(Date.now() - 12 * 60 * 1000), // 12 mins ago
      acknowledgedAt: new Date(Date.now() - 8 * 60 * 1000),
      resolvedAt: null,
    },
  ],
};

async function initPrisma() {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('placeholder')) {
    try {
      prisma = new PrismaClient();
      await prisma.$connect();
      isPrismaConnected = true;
      console.log('✓ Successfully connected to Neon PostgreSQL via Prisma');
    } catch (err) {
      console.warn('⚠️ Could not connect to Neon PostgreSQL. Falling back to local in-memory store:', err.message);
      isPrismaConnected = false;
    }
  } else {
    console.log('ℹ️ DATABASE_URL is placeholder or not set. Running with high-performance in-memory mock store.');
    isPrismaConnected = false;
  }
}

// Data access operations
const db = {
  async isConnected() {
    return isPrismaConnected;
  },

  // --- Nurse Auth operations ---
  async findNurseByEmailOrEmployeeId(identifier) {
    if (!identifier) return null;
    const clean = identifier.trim().toLowerCase();

    if (isPrismaConnected) {
      return await prisma.nurse.findFirst({
        where: {
          OR: [
            { email: { equals: clean, mode: 'insensitive' } },
            { employeeId: { equals: identifier.trim(), mode: 'insensitive' } },
          ],
        },
      });
    }

    return (
      memoryStore.nurses.find(
        (n) =>
          n.email.toLowerCase() === clean ||
          n.employeeId.toLowerCase() === identifier.trim().toLowerCase()
      ) || null
    );
  },

  async findNurseById(id) {
    if (isPrismaConnected) {
      return await prisma.nurse.findUnique({
        where: { id },
      });
    }
    return memoryStore.nurses.find((n) => n.id === id) || null;
  },

  async createNurse({ name, email, employeeId, passwordHash, department }) {
    if (isPrismaConnected) {
      return await prisma.nurse.create({
        data: {
          name,
          email: email.trim().toLowerCase(),
          employeeId: employeeId.trim(),
          passwordHash,
          department: department || 'Inpatient Care',
        },
      });
    }

    const newNurse = {
      id: crypto.randomUUID ? crypto.randomUUID() : `nurse-${Date.now()}`,
      name,
      email: email.trim().toLowerCase(),
      employeeId: employeeId.trim(),
      passwordHash,
      department: department || 'Inpatient Care',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryStore.nurses.push(newNurse);
    return newNurse;
  },

  // --- Bed operations ---
  async getBedByQrToken(qrToken) {
    if (isPrismaConnected) {
      return await prisma.bed.findUnique({
        where: { qrToken },
      });
    }
    return memoryStore.beds.find((b) => b.qrToken === qrToken) || null;
  },

  async getAllBeds() {
    if (isPrismaConnected) {
      return await prisma.bed.findMany({
        orderBy: [{ roomNumber: 'asc' }, { bedNumber: 'asc' }],
      });
    }
    return [...memoryStore.beds];
  },

  async getBedById(id) {
    if (isPrismaConnected) {
      return await prisma.bed.findUnique({
        where: { id },
      });
    }
    return memoryStore.beds.find((b) => b.id === id) || null;
  },

  // --- Patient Assistance Request operations ---
  async createAssistanceRequest({ bedId, requestType, customNote }) {
    if (isPrismaConnected) {
      return await prisma.patientAssistanceRequest.create({
        data: {
          bedId,
          requestType,
          customNote: customNote?.trim() || null,
          status: 'PENDING',
        },
        include: {
          bed: true,
        },
      });
    }

    const bed = memoryStore.beds.find((b) => b.id === bedId);
    if (!bed) {
      throw new Error(`Bed with id ${bedId} not found`);
    }

    const newRequest = {
      id: crypto.randomUUID ? crypto.randomUUID() : `req-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      bedId,
      requestType,
      customNote: customNote?.trim() || null,
      status: 'PENDING',
      submittedAt: new Date(),
      acknowledgedAt: null,
      resolvedAt: null,
      bed,
    };

    memoryStore.requests.unshift(newRequest);
    return newRequest;
  },

  async getActiveRequests() {
    if (isPrismaConnected) {
      return await prisma.patientAssistanceRequest.findMany({
        where: {
          status: {
            in: ['PENDING', 'IN_PROGRESS'],
          },
        },
        include: {
          bed: true,
        },
        orderBy: {
          submittedAt: 'desc',
        },
      });
    }

    return memoryStore.requests
      .filter((r) => r.status === 'PENDING' || r.status === 'IN_PROGRESS')
      .map((r) => ({
        ...r,
        bed: memoryStore.beds.find((b) => b.id === r.bedId),
      }))
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  },

  async getRequestById(id) {
    if (isPrismaConnected) {
      return await prisma.patientAssistanceRequest.findUnique({
        where: { id },
        include: {
          bed: true,
        },
      });
    }

    const req = memoryStore.requests.find((r) => r.id === id);
    if (!req) return null;
    return {
      ...req,
      bed: memoryStore.beds.find((b) => b.id === req.bedId),
    };
  },

  async updateRequestStatus(id, newStatus) {
    const updateData = {
      status: newStatus,
    };

    const now = new Date();
    if (newStatus === 'IN_PROGRESS') {
      updateData.acknowledgedAt = now;
    } else if (newStatus === 'RESOLVED') {
      updateData.resolvedAt = now;
    }

    if (isPrismaConnected) {
      return await prisma.patientAssistanceRequest.update({
        where: { id },
        data: updateData,
        include: {
          bed: true,
        },
      });
    }

    const index = memoryStore.requests.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error(`Request with ID ${id} not found`);
    }

    const updated = {
      ...memoryStore.requests[index],
      ...updateData,
    };
    memoryStore.requests[index] = updated;

    return {
      ...updated,
      bed: memoryStore.beds.find((b) => b.id === updated.bedId),
    };
  },
};

module.exports = {
  db,
  initPrisma,
  getPrismaClient: () => prisma,
};
