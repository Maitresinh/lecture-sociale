const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Vérifier s'il existe déjà un admin
    const existingAdmin = await prisma.user.findFirst({
      where: { status: 'ADMIN' }
    });
    
    if (existingAdmin) {
      console.log('📋 Admin existe déjà:');
      console.log('Email:', existingAdmin.email);
      console.log('Nom:', existingAdmin.name);
      
      // Mettre à jour le mot de passe pour être sûr
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { password: hashedPassword }
      });
      console.log('🔄 Mot de passe mis à jour: admin123');
      return;
    }
    
    // Créer un admin avec des credentials simples
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin@admin.com',
        password: hashedPassword,
        status: 'ADMIN'
      }
    });
    
    console.log('✅ Admin créé avec succès!');
    console.log('📧 Email: admin@admin.com');
    console.log('🔑 Mot de passe: admin123');
    console.log('👤 ID:', admin.id);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();