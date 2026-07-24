-- AlterTable
ALTER TABLE "AboutSection" ADD COLUMN     "companyNameEn" TEXT,
ADD COLUMN     "descriptionEn" TEXT;

-- AlterTable
ALTER TABLE "GalleryImage" ADD COLUMN     "altEn" TEXT,
ADD COLUMN     "labelEn" TEXT;

-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "nameEn" TEXT;

-- AlterTable
ALTER TABLE "NewCity" ADD COLUMN     "cityEn" TEXT,
ADD COLUMN     "dateEn" TEXT;

-- AlterTable
ALTER TABLE "NewsBlock" ADD COLUMN     "contentEn" TEXT;

-- AlterTable
ALTER TABLE "NewsPost" ADD COLUMN     "descriptionEn" TEXT,
ADD COLUMN     "titleEn" TEXT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "additionalInfoEn" TEXT,
ADD COLUMN     "descriptionEn" TEXT,
ADD COLUMN     "heroSubtitleEn" TEXT,
ADD COLUMN     "locationEn" TEXT;

-- AlterTable
ALTER TABLE "ProjectSection" ADD COLUMN     "descriptionEn" TEXT,
ADD COLUMN     "headingEn" TEXT,
ADD COLUMN     "labelEn" TEXT;

-- AlterTable
ALTER TABLE "SectionItem" ADD COLUMN     "descriptionEn" TEXT,
ADD COLUMN     "subtitleEn" TEXT,
ADD COLUMN     "titleEn" TEXT;

-- AlterTable
ALTER TABLE "TeamMember" ADD COLUMN     "roleEn" TEXT;

-- AlterTable
ALTER TABLE "UpcomingInvestment" ADD COLUMN     "descriptionEn" TEXT,
ADD COLUMN     "statusEn" TEXT,
ADD COLUMN     "titleEn" TEXT;
