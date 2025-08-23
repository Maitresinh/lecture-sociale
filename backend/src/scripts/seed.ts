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

  // Créer des utilisateurs de test
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

  const pierre = await prisma.user.upsert({
    where: { email: 'pierre@example.com' },
    update: {},
    create: {
      name: 'Pierre Martin',
      email: 'pierre@example.com',
      password: userPassword,
      status: 'TRANSLATOR'
    }
  })

  const sophie = await prisma.user.upsert({
    where: { email: 'sophie@example.com' },
    update: {},
    create: {
      name: 'Sophie Laurent',
      email: 'sophie@example.com',
      password: userPassword,
      status: 'USER'
    }
  })

  console.log('👥 Utilisateurs créés')

  // Créer des livres de démonstration
  const lesMiserables = await prisma.book.upsert({
    where: { id: 'book-les-miserables' },
    update: {},
    create: {
      id: 'book-les-miserables',
      title: 'Les Misérables',
      author: 'Victor Hugo',
      description: 'Un roman historique français qui décrit la vie de diverses personnes en France au début du XIXe siècle, en portant un regard particulier sur la condition des plus démunis.',
      epubUrl: '/books/les-miserables.epub',
      epubPath: 'uploads/books/les-miserables.epub',
      totalPages: 1200,
      coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop'
    }
  })

  const voyageCentreTerre = await prisma.book.upsert({
    where: { id: 'book-voyage-centre-terre' },
    update: {},
    create: {
      id: 'book-voyage-centre-terre',
      title: 'Voyage au centre de la Terre',
      author: 'Jules Verne',
      description: 'Roman d\'aventures et de science-fiction publié en 1864, qui raconte l\'expédition d\'un professeur de géologie et de son neveu vers le centre de la Terre.',
      epubUrl: '/books/voyage-centre-terre.epub',
      epubPath: 'uploads/books/voyage-centre-terre.epub',
      totalPages: 300,
      coverUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=400&fit=crop'
    }
  })

  const petitPrince = await prisma.book.upsert({
    where: { id: 'book-petit-prince' },
    update: {},
    create: {
      id: 'book-petit-prince',
      title: 'Le Petit Prince',
      author: 'Antoine de Saint-Exupéry',
      description: 'Conte philosophique et poétique sous l\'apparence d\'un conte pour enfants, publié en 1943.',
      epubUrl: '/books/petit-prince.epub',
      epubPath: 'uploads/books/petit-prince.epub',
      totalPages: 120,
      coverUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop'
    }
  })

  console.log('📚 Livres créés')

  // Créer des lectures partagées
  const lectureMiserables = await prisma.sharedReading.upsert({
    where: { id: 'reading-miserables' },
    update: {},
    create: {
      id: 'reading-miserables',
      title: 'Découvrons ensemble Les Misérables',
      description: 'Une lecture collaborative du chef-d\'œuvre de Victor Hugo. Plongeons dans cette fresque sociale du XIXe siècle et partageons nos réflexions sur ce récit intemporel.',
      bookId: lesMiserables.id,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      isPublic: true,
      createdBy: marie.id
    }
  })

  const lectureVerne = await prisma.sharedReading.upsert({
    where: { id: 'reading-verne' },
    update: {},
    create: {
      id: 'reading-verne',
      title: 'Voyage au centre de la Terre - Club de lecture',
      description: 'Embarquons pour une aventure extraordinaire avec Jules Verne ! Une lecture parfaite pour découvrir les merveilles de la science-fiction classique.',
      bookId: voyageCentreTerre.id,
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-03-15'),
      isPublic: true,
      createdBy: pierre.id
    }
  })

  const lecturePetitPrince = await prisma.sharedReading.upsert({
    where: { id: 'reading-petit-prince' },
    update: {},
    create: {
      id: 'reading-petit-prince',
      title: 'Le Petit Prince - Lecture philosophique',
      description: 'Redécouvrons ensemble ce conte philosophique intemporel. Une lecture qui nous invite à retrouver notre regard d\'enfant sur le monde.',
      bookId: petitPrince.id,
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Dans une semaine
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Dans un mois
      isPublic: true,
      createdBy: sophie.id
    }
  })

  console.log('📖 Lectures partagées créées')

  // Ajouter des participants
  await prisma.sharedReadingParticipant.createMany({
    data: [
      // Les Misérables
      { sharedReadingId: lectureMiserables.id, userId: marie.id, progress: 0.15 },
      { sharedReadingId: lectureMiserables.id, userId: pierre.id, progress: 0.23 },
      { sharedReadingId: lectureMiserables.id, userId: sophie.id, progress: 0.08 },
      { sharedReadingId: lectureMiserables.id, userId: admin.id, progress: 0.45 },
      
      // Voyage au centre de la Terre
      { sharedReadingId: lectureVerne.id, userId: pierre.id, progress: 0.67 },
      { sharedReadingId: lectureVerne.id, userId: sophie.id, progress: 0.54 },
      { sharedReadingId: lectureVerne.id, userId: admin.id, progress: 0.72 },
      
      // Le Petit Prince
      { sharedReadingId: lecturePetitPrince.id, userId: sophie.id, progress: 0.0 },
      { sharedReadingId: lecturePetitPrince.id, userId: marie.id, progress: 0.0 }
    ],
    skipDuplicates: true
  })

  // Ajouter quelques annotations d'exemple
  await prisma.annotation.createMany({
    data: [
      {
        sharedReadingId: lectureMiserables.id,
        userId: pierre.id,
        content: 'Ce passage sur la bataille de Waterloo est remarquablement documenté !',
        cfi: 'epubcfi(/6/4[chapter-1]!/4/2/2[page-1]/2:0)',
        selectedText: 'L\'année 1815 fut marquée par une extraordinaire apparition d\'un homme sur l\'horizon européen.',
        page: 156,
        isPublic: true
      },
      {
        sharedReadingId: lectureMiserables.id,
        userId: sophie.id,
        content: 'L\'évolution de Jean Valjean est absolument fascinante.',
        cfi: 'epubcfi(/6/8[chapter-2]!/4/3/1[page-2]/4:12)',
        selectedText: 'La conscience de Jean Valjean recula devant cette vision de l\'abîme.',
        page: 78,
        isPublic: true
      },
      {
        sharedReadingId: lectureVerne.id,
        userId: admin.id,
        content: 'Jules Verne avait une vision incroyable de la géologie !',
        cfi: 'epubcfi(/6/12[chapter-3]!/4/2/3[page-3]/1:24)',
        selectedText: 'Les couches géologiques se succédaient avec une régularité mathématique.',
        page: 124,
        isPublic: true
      }
    ],
    skipDuplicates: true
  })

  console.log('💬 Annotations créées')
  console.log('✅ Seeding terminé avec succès !')
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