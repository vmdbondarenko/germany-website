import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Newspaper, Pencil, ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function NewsAdminPage() {
  const posts = await prisma.newsPost.findMany({
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    include: {
      blocks: {
        where: { type: 'image' },
        orderBy: { order: 'asc' },
        take: 1,
      },
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Aktuelles</h1>
          <p className="text-gray-500 mt-1">Beiträge der Aktuelles-Seite verwalten</p>
        </div>
        <Link href="/admin/news/new">
          <Button style={{ backgroundColor: '#6E2E2A' }}>
            <Plus className="h-4 w-4 mr-2" />
            Beitrag hinzufügen
          </Button>
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Noch keine Beiträge. Fügen Sie den ersten hinzu!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const thumb = post.coverImageUrl ?? post.blocks[0]?.imageUrl
            return (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-4 py-4">
                  {thumb ? (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <Image src={thumb} alt={post.title} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Newspaper className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 truncate">{post.title}</span>
                      <Badge variant={post.published ? 'default' : 'secondary'}>
                        {post.published ? 'Veröffentlicht' : 'Entwurf'}
                      </Badge>
                    </div>
                    {post.description && (
                      <p className="text-sm text-gray-500 line-clamp-2">{post.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      /{post.slug} &middot;{' '}
                      {post.publishedAt
                        ? post.publishedAt.toLocaleDateString('de-DE')
                        : post.createdAt.toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {post.published && (
                      <Link href={`/aktuelles/${post.slug}`} target="_blank">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    )}
                    <Link href={`/admin/news/${post.id}`}>
                      <Button variant="outline" size="sm">
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Bearbeiten
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
