-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "companyName" TEXT,
    "managingDirector" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "street" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "country" TEXT,
    "registerCourt" TEXT,
    "registrationNumber" TEXT,
    "vatId" TEXT,
    "mapEmbedSrc" TEXT,
    "mapHref" TEXT,
    "instagramUrl" TEXT,
    "youtubeUrl" TEXT,
    "facebookUrl" TEXT,
    "linkedinUrl" TEXT,
    "logoUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

