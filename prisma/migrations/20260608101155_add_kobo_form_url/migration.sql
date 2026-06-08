-- CreateTable
CREATE TABLE "kobo_form_url" (
    "id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kobo_form_url_pkey" PRIMARY KEY ("id")
);
