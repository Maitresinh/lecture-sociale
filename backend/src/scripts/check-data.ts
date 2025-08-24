import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📚 Livres dans la base:')
  const books = await prisma.book.findMany()
  console.log(books)

  console.log('\n📖 Lectures partagées:')
  const readings = await prisma.sharedReading.findMany({
    include: {
      book: true,
      participants: true
    }
  })
  console.log(readings)

  console.log('\n👥 Utilisateurs:')
  const users = await prisma.user.findMany()
  console.log(users)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })