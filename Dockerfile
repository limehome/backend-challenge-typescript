FROM node:26.13.1-alpine
WORKDIR /app
COPY package*.json prisma.config.ts ./
COPY src/prisma src/prisma
RUN npm ci
EXPOSE 8000
CMD ["npm", "run", "dev"]
