# Use a lightweight Node.js image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy your package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all your JavaScript files (index.js, config.js, etc.)
COPY . .

# Open the port for your Twilio SMS webhook
EXPOSE 3002

# The command to start your engine
CMD ["node", "index.js"]