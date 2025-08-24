const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createDefaultBooks() {
  try {
    // Créer quelques livres EPUB par défaut
    const books = [
      {
        title: 'Alice au Pays des Merveilles',
        author: 'Lewis Carroll',
        description: 'Un classique de la littérature pour enfants',
        totalChapters: 12,
        epubMetadata: JSON.stringify({
          chapters: Array.from({length: 12}, (_, i) => ({
            id: `ch${i+1}`,
            title: `Chapitre ${i+1}`,
            href: `chapter${i+1}.xhtml`,
            order: i+1
          })),
          opfPath: 'OEBPS/content.opf'
        })
      },
      {
        title: 'Le Petit Prince',
        author: 'Antoine de Saint-Exupéry', 
        description: 'Un conte poétique et philosophique',
        totalChapters: 27,
        epubMetadata: JSON.stringify({
          chapters: Array.from({length: 27}, (_, i) => ({
            id: `ch${i+1}`,
            title: `Chapitre ${i+1}`,
            href: `chapter${i+1}.xhtml`,
            order: i+1
          })),
          opfPath: 'OEBPS/content.opf'
        })
      },
      {
        title: 'Les Misérables (Tome 1)',
        author: 'Victor Hugo',
        description: 'Le chef-d\'œuvre de Victor Hugo',
        totalChapters: 48,
        epubMetadata: JSON.stringify({
          chapters: Array.from({length: 48}, (_, i) => ({
            id: `ch${i+1}`,
            title: `Livre ${Math.floor(i/8)+1} - Chapitre ${(i%8)+1}`,
            href: `chapter${i+1}.xhtml`,
            order: i+1
          })),
          opfPath: 'OEBPS/content.opf'
        })
      }
    ];

    for (const book of books) {
      const existing = await prisma.book.findFirst({
        where: { title: book.title }
      });
      
      if (!existing) {
        await prisma.book.create({ data: book });
        console.log(`✅ Livre créé: ${book.title}`);
      } else {
        console.log(`📖 Livre existe déjà: ${book.title}`);
      }
    }
    
    console.log('🎉 Livres par défaut créés !');
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDefaultBooks();