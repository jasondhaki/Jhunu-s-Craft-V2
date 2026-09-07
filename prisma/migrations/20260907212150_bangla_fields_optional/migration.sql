-- AlterTable
ALTER TABLE "collections" ALTER COLUMN "title_bn" DROP NOT NULL,
ALTER COLUMN "intro_bn" DROP NOT NULL;

-- AlterTable
ALTER TABLE "pages" ALTER COLUMN "title_bn" DROP NOT NULL,
ALTER COLUMN "body_bn" DROP NOT NULL;

-- AlterTable
ALTER TABLE "product_images" ALTER COLUMN "alt_text_bn" DROP NOT NULL;

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "name_bn" DROP NOT NULL,
ALTER COLUMN "short_description_bn" DROP NOT NULL,
ALTER COLUMN "description_bn" DROP NOT NULL,
ALTER COLUMN "capacity_note_bn" DROP NOT NULL,
ALTER COLUMN "materials_detail_bn" DROP NOT NULL,
ALTER COLUMN "care_instructions_bn" DROP NOT NULL;

-- AlterTable
ALTER TABLE "shipping_rates" ALTER COLUMN "name_bn" DROP NOT NULL;

-- AlterTable
ALTER TABLE "shipping_zones" ALTER COLUMN "name_bn" DROP NOT NULL;

-- AlterTable
ALTER TABLE "tags" ALTER COLUMN "label_bn" DROP NOT NULL;

-- AlterTable
ALTER TABLE "variants" ALTER COLUMN "color_name_bn" DROP NOT NULL;
