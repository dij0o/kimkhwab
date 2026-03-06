FROM node:22-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the Vite default port
EXPOSE 5173

# Command to run the development server, binding to all interfaces
CMD ["npm", "run", "dev", "--", "--host"]
