FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY vite.config.js ./

RUN npm install
COPY . .
RUN chown -R node:node /app
USER node
EXPOSE 5173

CMD ["npm", "run", "dev"]