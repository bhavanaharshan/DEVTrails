FROM node:22-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of your frontend code
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
