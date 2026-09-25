FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --ignore-scripts

COPY . .

RUN npx prisma generate

EXPOSE 8080

CMD npx prisma migrate deploy && npm run dev