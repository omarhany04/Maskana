FROM node:22-alpine AS builder

WORKDIR /workspace

COPY package.json ./package.json
COPY tsconfig.base.json ./tsconfig.base.json
COPY app/package.json ./app/package.json
COPY shared/package.json ./shared/package.json

RUN npm install

COPY . .

WORKDIR /workspace/app
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /workspace

ENV NODE_ENV=production

COPY --from=builder /workspace/package.json ./package.json
COPY --from=builder /workspace/node_modules ./node_modules
COPY --from=builder /workspace/app ./app
COPY --from=builder /workspace/shared ./shared
COPY --from=builder /workspace/prisma ./prisma
COPY --from=builder /workspace/tsconfig.base.json ./tsconfig.base.json

WORKDIR /workspace/app

EXPOSE 3000

CMD ["npm", "run", "start"]

