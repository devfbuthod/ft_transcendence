FROM node:14.17.5-alpine3.14

# Create app directory
WORKDIR /app

COPY package*.json ./

RUN npm install

#bundle app sources
COPY . .

RUN npm run build

EXPOSE 5000

CMD ["npm", "run", "start:dev"]