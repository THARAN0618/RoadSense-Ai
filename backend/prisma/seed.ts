import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.repairUpdate.deleteMany();
  await prisma.potholeReport.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'Sarah Connor (Admin)',
      email: 'admin@roadsense.demo',
      phone: '+1 (555) 019-2831',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const authority = await prisma.user.create({
    data: {
      name: 'Chief Inspector Marcus Vance',
      email: 'authority@roadsense.demo',
      phone: '+1 (555) 014-9922',
      passwordHash,
      role: 'AUTHORITY',
      isActive: true,
    },
  });

  const worker = await prisma.user.create({
    data: {
      name: 'David Miller (Field Crew Lead)',
      email: 'worker@roadsense.demo',
      phone: '+1 (555) 018-7744',
      passwordHash,
      role: 'FIELD_WORKER',
      isActive: true,
    },
  });

  const citizen = await prisma.user.create({
    data: {
      name: 'Alex Johnson',
      email: 'citizen@roadsense.demo',
      phone: '+1 (555) 012-3456',
      passwordHash,
      role: 'CITIZEN',
      isActive: true,
    },
  });

  console.log('✅ Users created: Admin, Authority, Worker, Citizen');

  // 2. Create Sample Pothole Reports
  const report1 = await prisma.potholeReport.create({
    data: {
      reporterId: citizen.id,
      title: 'Deep Critted Trench near Highway 101 Exit 4',
      description: 'Massive asphalt depression causing severe alignment hazard for high-speed vehicles. Wheel rim damaged by a commuter this morning.',
      latitude: 37.774929,
      longitude: -122.419416,
      address: 'Market St & 10th St, San Francisco, CA',
      imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&q=80',
      severity: 'CRITICAL',
      severityScore: 88,
      priority: 'CRITICAL',
      priorityScore: 92,
      aiSeverity: 'CRITICAL',
      aiPriority: 'CRITICAL',
      aiPriorityScore: 92,
      confidenceScore: 0.94,
      aiReason: 'Vision heuristic identified multi-layered asphalt fracture > 6 inches deep with sharp structural edge.',
      isFallbackAnalysis: false,
      priorityExplanation: 'CRITICAL priority (Score: 92/100) calculated due to high severity score (88/100), 94% confidence, and high traffic density corridor.',
      status: 'VERIFIED',
      verificationStatus: 'VERIFIED',
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      verifiedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  const report2 = await prisma.potholeReport.create({
    data: {
      reporterId: citizen.id,
      assignedWorkerId: worker.id,
      title: 'Active Crater on Oak Street Bus Bay',
      description: 'Pothole expanded after recent heavy rainfall. Buses are swerving into bike lane to avoid it.',
      latitude: 37.771234,
      longitude: -122.423456,
      address: '450 Oak St, San Francisco, CA',
      imageUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=800&q=80',
      severity: 'HIGH',
      severityScore: 74,
      priority: 'HIGH',
      priorityScore: 79,
      aiSeverity: 'HIGH',
      aiPriority: 'HIGH',
      aiPriorityScore: 79,
      confidenceScore: 0.89,
      aiReason: 'Circular depression with exposed gravel base layer.',
      isFallbackAnalysis: false,
      priorityExplanation: 'HIGH priority (Score: 79/100) based on severity (74/100) and proximity to public transit lane.',
      status: 'IN_PROGRESS',
      verificationStatus: 'VERIFIED',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      verifiedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  const report3 = await prisma.potholeReport.create({
    data: {
      reporterId: citizen.id,
      assignedWorkerId: worker.id,
      title: 'Repaired Fissure near Elm Park Elementary',
      description: 'Minor pothole right in front of crosswalk. Quick asphalt patch completed by municipal crew.',
      latitude: 37.768912,
      longitude: -122.415678,
      address: '120 Elm St, San Francisco, CA',
      imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&q=80',
      severity: 'MEDIUM',
      severityScore: 45,
      priority: 'MEDIUM',
      priorityScore: 48,
      aiSeverity: 'MEDIUM',
      aiPriority: 'MEDIUM',
      aiPriorityScore: 48,
      confidenceScore: 0.82,
      aiReason: 'Surface crack with shallow cavity depth ~ 2 inches.',
      isFallbackAnalysis: false,
      priorityExplanation: 'MEDIUM priority (Score: 48/100). Moderate depth near school zone.',
      status: 'REPAIRED',
      verificationStatus: 'VERIFIED',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      verifiedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  const report4 = await prisma.potholeReport.create({
    data: {
      reporterId: citizen.id,
      title: 'Newly Reported Shallow Asphalt Sink on Pine St',
      description: 'Small pothole starting to form near curb inlet.',
      latitude: 37.789101,
      longitude: -122.408912,
      address: '890 Pine St, San Francisco, CA',
      imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80',
      severity: 'LOW',
      severityScore: 22,
      priority: 'LOW',
      priorityScore: 25,
      aiSeverity: 'LOW',
      aiPriority: 'LOW',
      aiPriorityScore: 25,
      confidenceScore: 0.78,
      aiReason: 'Early surface wear with minimal depth.',
      isFallbackAnalysis: true,
      priorityExplanation: 'LOW priority (Score: 25/100) calculated via AI-assisted fallback rules.',
      status: 'SUBMITTED',
      verificationStatus: 'PENDING',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    },
  });

  console.log('✅ Created 4 realistic sample reports');

  // 3. Create Repair Updates for report 2 & 3
  await prisma.repairUpdate.create({
    data: {
      reportId: report2.id,
      workerId: worker.id,
      status: 'IN_PROGRESS',
      notes: 'Dispatched cold-mix crew. Area cordoned off with safety cones.',
      beforeImageUrl: report2.imageUrl,
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
  });

  await prisma.repairUpdate.create({
    data: {
      reportId: report3.id,
      workerId: worker.id,
      status: 'REPAIRED',
      notes: 'Hot-mix asphalt patch laid, compacted with roller, and seal applied.',
      beforeImageUrl: report3.imageUrl,
      afterImageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&q=80',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  });

  // 4. Create Comments
  await prisma.comment.createMany({
    data: [
      {
        reportId: report1.id,
        userId: citizen.id,
        message: 'Bumping this! Almost lost control of my sedan here yesterday evening.',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        reportId: report1.id,
        userId: authority.id,
        message: 'Report verified. Escalated to Emergency Repair Division for immediate dispatch.',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        reportId: report2.id,
        userId: worker.id,
        message: 'On site now. Repair actively under way.',
        createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
      },
    ],
  });

  // 5. Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: citizen.id,
        title: 'Report Status Updated',
        message: 'Your report "Deep Critted Trench near Highway 101 Exit 4" has been VERIFIED by Department of Transportation.',
        type: 'STATUS_UPDATE',
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        userId: worker.id,
        title: 'New Job Assigned',
        message: 'You have been assigned to repair "Active Crater on Oak Street Bus Bay".',
        type: 'JOB_ASSIGNED',
        isRead: true,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        userId: authority.id,
        title: 'New High Severity Pothole Reported',
        message: 'New CRITICAL severity report submitted near Market St & 10th St.',
        type: 'NEW_REPORT',
        isRead: false,
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // 6. Create Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: citizen.id,
        action: 'REPORT_SUBMITTED',
        entityType: 'PotholeReport',
        entityId: report1.id,
        metadata: JSON.stringify({ title: report1.title, severity: 'CRITICAL' }),
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        userId: authority.id,
        action: 'REPORT_VERIFIED',
        entityType: 'PotholeReport',
        entityId: report1.id,
        metadata: JSON.stringify({ status: 'VERIFIED', verifiedBy: authority.name }),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        userId: authority.id,
        action: 'WORKER_ASSIGNED',
        entityType: 'PotholeReport',
        entityId: report2.id,
        metadata: JSON.stringify({ assignedWorkerId: worker.id, workerName: worker.name }),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log('✅ Audit logs and notifications seeded successfully.');
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
