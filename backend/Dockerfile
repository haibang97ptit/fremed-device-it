FROM node:20-alpine

# ping cần thêm iputils
RUN apk add --no-cache iputils

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .

EXPOSE 3000
CMD ["node", "src/index.js"]
