-- CreateTable
CREATE TABLE "HomeSection" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "eyebrowDe" TEXT,
    "eyebrowEn" TEXT,
    "headingDe" TEXT,
    "headingEn" TEXT,
    "descriptionDe" TEXT,
    "descriptionEn" TEXT,
    "imageUrl" TEXT,
    "imageUrl2" TEXT,
    "primaryCtaLabelDe" TEXT,
    "primaryCtaLabelEn" TEXT,
    "primaryCtaHref" TEXT,
    "secondaryCtaLabelDe" TEXT,
    "secondaryCtaLabelEn" TEXT,
    "secondaryCtaHref" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeSectionItem" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "icon" TEXT,
    "titleDe" TEXT,
    "titleEn" TEXT,
    "descriptionDe" TEXT,
    "descriptionEn" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomeSectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HomeSectionItem_sectionId_idx" ON "HomeSectionItem"("sectionId");

-- AddForeignKey
ALTER TABLE "HomeSectionItem" ADD CONSTRAINT "HomeSectionItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "HomeSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
