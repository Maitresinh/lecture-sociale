import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📖 Création d\'une lecture partagée pour Les Misérables...')

  // Trouver le livre et l'admin
  const book = await prisma.book.findUnique({
    where: { id: 'book-les-miserables' }
  })

  const admin = await prisma.user.findUnique({
    where: { email: 'admin@lecture-sociale.fr' }
  })

  if (!book || !admin) {
    console.error('❌ Livre ou admin introuvable')
    return
  }

  // Créer une lecture partagée
  const sharedReading = await prisma.sharedReading.create({
    data: {
      id: 'reading-les-miserables',
      title: 'Lecture collaborative - Les Misérables',
      description: 'Découvrons ensemble ce chef-d\'œuvre de Victor Hugo dans une expérience de lecture collaborative !',
      bookId: book.id,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-12-31'), // Une longue période pour les tests
      isPublic: true,
      createdBy: admin.id,
      participants: {
        create: {
          userId: admin.id,
          progress: 0
        }
      }
    },
    include: {
      book: true,
      creator: true,
      participants: true
    }
  })

  console.log('✅ Lecture partagée créée:', sharedReading)
  console.log('🔗 ID de la lecture:', sharedReading.id)
  console.log('👥 Participants:', sharedReading.participants.length)
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