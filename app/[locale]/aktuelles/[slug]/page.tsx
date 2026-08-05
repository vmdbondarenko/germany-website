import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { prisma } from '@/lib/prisma'
import { pick } from '@/lib/i18n-content'
import type { Locale } from '@/i18n/routing'
import { HeaderServer } from '@/components/header-server'
import { Footer } from '@/components/footer'
import { NewsPostContent } from '@/components/news-post-content'
import { JsonLd, articleSchema } from '@/lib/seo/json-ld'
import { Calendar, ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const locale = (await getLocale()) as Locale
  const canonical = `/aktuelles/${slug}`
  const post = await prisma.newsPost.findUnique({ where: { slug } })
  if (!post || !post.published) return { title: 'News', alternates: { canonical } }

  const title = pick(post.title, post.titleEn, locale)
  const description = pick(post.description, post.descriptionEn, locale) ?? undefined
  const pageTitle = `${title} — News`
  const images = post.coverImageUrl ? [post.coverImageUrl] : undefined

  return {
    title: pageTitle,
    description,
    alternates: { canonical, languages: { de: canonical, en: `/en${canonical}` } },
    openGraph: {
      title: pageTitle,
      description,
      url: canonical,
      type: 'article',
      ...(images ? { images } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description,
      ...(images ? { images } : {}),
    },
  }
}

export default async function NewsPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const locale = (await getLocale()) as Locale
  const t = await getTranslations('news')
  const dateLocale = locale === 'en' ? 'en-US' : 'de-DE'

  const raw = await prisma.newsPost.findUnique({
    where: { slug },
    include: { blocks: { orderBy: { order: 'asc' } } },
  })

  if (!raw || !raw.published) notFound()

  const post = {
    ...raw,
    title: pick(raw.title, raw.titleEn, locale),
    description: pick(raw.description, raw.descriptionEn, locale),
    coverImageAlt: pick(raw.coverImageAlt, raw.coverImageAltEn, locale),
    blocks: raw.blocks.map((b) => ({ ...b, content: pick(b.content, b.contentEn, locale) })),
  }

  const date = post.publishedAt ?? post.createdAt

  const article = articleSchema({
    headline: post.title,
    description: post.description,
    image: post.coverImageUrl
      ? { url: post.coverImageUrl, caption: post.title }
      : null,
    datePublished: date,
    dateModified: post.updatedAt,
    path: `/aktuelles/${post.slug}`,
  })

  return (
    <>
      <JsonLd schema={article} />
      <HeaderServer />
      <main className="min-h-screen bg-background">
        <article className="pt-24 pb-20 lg:pb-32">
          <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
            <Link
              href="/aktuelles"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('backToList')}
            </Link>

            <header className="mb-10">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
                <Calendar className="h-4 w-4" />
                {date.toLocaleDateString(dateLocale, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
              <h1
                className="font-serif text-3xl lg:text-5xl font-semibold mb-5 leading-tight"
                style={{ color: '#3E1718' }}
              >
                {post.title}
              </h1>
              {post.description && (
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {post.description}
                </p>
              )}
            </header>

            {post.coverImageUrl && (
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-12 shadow-lg">
                <Image
                  src={post.coverImageUrl}
                  alt={post.coverImageAlt || post.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 896px"
                />
              </div>
            )}

            <NewsPostContent blocks={post.blocks} postTitle={post.title} />
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
