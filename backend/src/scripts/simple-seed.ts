import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seeding...')

  // Créer un admin
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lecture-sociale.fr' },
    update: {},
    create: {
      name: 'Administrateur',
      email: 'admin@lecture-sociale.fr',
      password: adminPassword,
      status: 'ADMIN'
    }
  })

  // Créer un utilisateur de test
  const userPassword = await bcrypt.hash('password123', 10)
  
  const marie = await prisma.user.upsert({
    where: { email: 'marie@example.com' },
    update: {},
    create: {
      name: 'Marie Dubois',
      email: 'marie@example.com',
      password: userPassword,
      status: 'AUTHOR'
    }
  })

  console.log('👥 Utilisateurs créés')

  // Créer un livre de démonstration
  const lesMiserables = await prisma.book.create({
    data: {
      id: 'book-les-miserables',
      title: 'Les Misérables',
      author: 'Victor Hugo',
      description: 'Un roman historique français qui décrit la vie de diverses personnes en France au début du XIXe siècle.',
      epubUrl: '/books/les-miserables.epub',
      epubPath: 'uploads/books/les-miserables.epub',
      totalPages: 1200,
      coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop'
    }
  })

  console.log('📚 Livre créé')

  console.log('✅ Seeding terminé avec succès !')
  console.log('🔑 Comptes créés :')
  console.log('  - Admin: admin@lecture-sociale.fr / admin123')
  console.log('  - Utilisateur: marie@example.com / password123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })