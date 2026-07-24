import Image from 'next/image'
import { getLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { prisma } from '@/lib/prisma'
import { pick } from '@/lib/i18n-content'
import type { Locale } from '@/i18n/routing'
import { HeaderServer } from '@/components/header-server'
import { Footer } from '@/components/footer'
import { Calendar, ArrowRight } from 'lucide-react'
import { JsonLd, itemListSchema } from '@/lib/seo/json-ld'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  alternates: { canonical: '/aktualnosci' },
}

export default async function AktualnosciPage() {
  const locale = (await getLocale()) as Locale
  const t = await getTranslations('news')
  const dateLocale = locale === 'en' ? 'en-US' : 'de-DE'

  const rows = await prisma.newsPost.findMany({
    where: { published: true },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    include: {
      blocks: {
        where: { type: 'image' },
        orderBy: { order: 'asc' },
        take: 1,
      },
    },
  })
  const posts = rows.map((p) => ({
    ...p,
    title: pick(p.title, p.titleEn, locale),
    description: pick(p.description, p.descriptionEn, locale),
  }))

  const itemList =
    posts.length > 0
      ? itemListSchema(
          posts.map((post) => ({
            name: post.title,
            path: `/aktualnosci/${post.slug}`,
          })),
        )
      : null

  return (
    <>
      {itemList && <JsonLd schema={itemList} />}
      <HeaderServer />
      <main className="min-h-screen bg-background">
        <div className="pt-24 pb-20 lg:pb-32">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-16">
              <h1
                className="font-serif text-4xl lg:text-5xl font-semibold mb-4"
                style={{ color: '#3E1718' }}
              >
                {t('heading')}
              </h1>
              <p className="text-muted-foreground text-base lg:text-lg max-w-2xl mx-auto">
                {t('subtitle')}
              </p>
            </div>

            {posts.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-lg">{t('empty')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post) => {
                  const thumb = post.coverImageUrl ?? post.blocks[0]?.imageUrl
                  const date = post.publishedAt ?? post.createdAt
                  return (
                    <Link
                      key={post.id}
                      href={`/aktualnosci/${post.slug}`}
                      className="group bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border border-border/50 flex flex-col"
                    >
                      {thumb ? (
                        <div className="relative aspect-[16/9] overflow-hidden">
                          <Image
                            src={thumb}
                            alt={post.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="aspect-[16/9] bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground text-sm">{t('noImage')}</span>
                        </div>
                      )}

                      <div className="p-6 flex flex-col flex-grow">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                          <Calendar className="h-3.5 w-3.5" />
                          {date.toLocaleDateString(dateLocale, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                        <h2
                          className="font-serif text-xl font-semibold mb-3"
                          style={{ color: '#3E1718' }}
                        >
                          {post.title}
                        </h2>
                        {post.description && (
                          <p className="text-sm text-muted-foreground line-clamp-3 flex-grow">
                            {post.description}
                          </p>
                        )}
                        <span
                          className="mt-4 inline-flex items-center gap-1 text-sm font-medium"
                          style={{ color: '#6E2E2A' }}
                        >
                          {t('readMore')}
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
