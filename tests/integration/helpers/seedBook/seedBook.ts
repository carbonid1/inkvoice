import { prisma } from '@/lib/services/db/db.service'

export const seedBook = async (id = 'book-1') => {
  await prisma.book.create({
    data: { id, title: 'Test', author: 'Author', filename: `${id}.epub` },
  })
}
