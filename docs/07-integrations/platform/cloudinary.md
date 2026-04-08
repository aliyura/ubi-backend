# Cloudinary Upload Integration

## Config Files
- `src/config/cloudinary.config.ts`
- `src/config/multer.config.ts`

## Capabilities Used
- Media storage for profile images and scam-report screenshots.
- Upload transformations for size/quality control.

## Authentication and Config Pattern
- Uses env credentials:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## Upload Pattern
- Multer uses `CloudinaryStorage`.
- Public id pattern includes user fullname + timestamp + original base filename.
- Allowed formats: `jpg`, `jpeg`, `png`, `webp`.
- Default transformation limits size and uses auto quality.
- Folder chosen by context (`profile` vs `report-scam`).
