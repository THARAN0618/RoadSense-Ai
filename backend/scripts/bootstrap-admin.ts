import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file if present
dotenv.config({ path: path.join(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function bootstrapAdmin() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || 'System Administrator';
  const phone = process.env.BOOTSTRAP_ADMIN_PHONE?.trim() || '';

  if (!email || !password) {
    console.error('❌ Error: BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD environment variables must be defined.');
    console.error('Usage example:');
    console.error('  BOOTSTRAP_ADMIN_EMAIL="admin@example.com" BOOTSTRAP_ADMIN_PASSWORD="SecurePassword123!" npm run bootstrap:admin');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('❌ Error: BOOTSTRAP_ADMIN_PASSWORD must be at least 6 characters long.');
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase();

  console.log(`🔍 Checking if account exists for email: ${normalizedEmail}...`);

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, role: true, isActive: true },
  });

  if (existingUser) {
    console.log(`⚠️ User account already exists for ${normalizedEmail} (Role: ${existingUser.role}, Active: ${existingUser.isActive}).`);
    console.log('Skipping creation to avoid duplicate or unintended modification.');
    process.exit(0);
  }

  console.log('🔒 Hashing admin password with bcrypt...');
  const passwordHash = await bcrypt.hash(password, 10);

  console.log('👤 Creating initial ADMIN account...');
  const newAdmin = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      phone,
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  console.log('----------------------------------------------------');
  console.log('✅ INITIAL ADMIN ACCOUNT CREATED SUCCESSFULLY');
  console.log(`   ID: ${newAdmin.id}`);
  console.log(`   Name: ${newAdmin.name}`);
  console.log(`   Email: ${newAdmin.email}`);
  console.log(`   Role: ${newAdmin.role}`);
  console.log(`   Status: ACTIVE (${newAdmin.isActive})`);
  console.log('----------------------------------------------------');
  console.log('👉 Remember to unset or remove BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD from your environment after execution.');
}

bootstrapAdmin()
  .catch((err) => {
    console.error('❌ Bootstrap error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
