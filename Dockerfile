FROM node:18-alpine AS builder
WORKDIR /app

COPY . .

RUN npm install

RUN npm run build
RUN mkdir -p dist/email/templates
RUN cp -R src/templates/* dist/email/templates/
RUN npm prune --production

FROM node:18-alpine AS production

WORKDIR /app
COPY --from=builder /app/package.json .
COPY --from=builder /app/package-lock.json .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Prisma client
RUN npx prisma generate

CMD ["npm", "run", "start:prod"]

CMD sh -c "npx prisma migrate deploy && npm run start:prod"
