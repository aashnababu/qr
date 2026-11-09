const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sampleBeds = [
  {
    roomNumber: '101',
    bedNumber: 'Bed-A',
    qrToken: 'QR-ROOM101-BEDA',
  },
  {
    roomNumber: '101',
    bedNumber: 'Bed-B',
    qrToken: 'QR-ROOM101-BEDB',
  },
  {
    roomNumber: '204',
    bedNumber: 'Bed-1',
    qrToken: 'QR-ROOM204-BED1',
  },
  {
    roomNumber: 'ICU-3',
    bedNumber: 'Bed-2',
    qrToken: 'QR-ROOM-ICU3-BED2',
  },
  {
    roomNumber: '302',
    bedNumber: 'Bed-A',
    qrToken: 'QR-ORTHO-302A',
  },
  {
    roomNumber: 'Ward-B',
    bedNumber: 'Bed-04',
    qrToken: 'QR-WARDB-BED04',
  },
];

async function main() {
  console.log('Seeding initial beds into database...');
  for (const bed of sampleBeds) {
    const upserted = await prisma.bed.upsert({
      where: { qrToken: bed.qrToken },
      update: {},
      create: {
        roomNumber: bed.roomNumber,
        bedNumber: bed.bedNumber,
        qrToken: bed.qrToken,
      },
    });
    console.log(`✓ Bed ready: Room ${upserted.roomNumber}, ${upserted.bedNumber} (Token: ${upserted.qrToken})`);
  }

  // Create an initial sample request for demonstration
  const sampleBed = await prisma.bed.findUnique({
    where: { qrToken: 'QR-ROOM101-BEDA' },
  });

  if (sampleBed) {
    const existingReq = await prisma.patientAssistanceRequest.findFirst({
      where: { bedId: sampleBed.id, status: 'PENDING' },
    });

    if (!existingReq) {
      await prisma.patientAssistanceRequest.create({
        data: {
          bedId: sampleBed.id,
          requestType: 'DRINKING_WATER',
          customNote: 'Needs warm drinking water and a fresh cup',
          status: 'PENDING',
          submittedAt: new Date(Date.now() - 3 * 60 * 1000), // 3 mins ago
        },
      });
      console.log('✓ Created sample PENDING request for Room 101, Bed-A');
    }
  }

  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

