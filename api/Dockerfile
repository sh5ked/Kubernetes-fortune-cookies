FROM node:26-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY app.js ./

ENV NODE_ENV=production

EXPOSE 3000

USER node

CMD ["node", "app.js"]