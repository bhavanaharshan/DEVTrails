# Use a lightweight Node.js image
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps
# Copy the rest of your frontend code
COPY . .

# Expose the port Vite runs on
EXPOSE 5173

# Start the Vite server (the --host flag is CRUCIAL for Docker)
CMD ["npm", "run", "dev", "--", "--host"]