# Use the official Node.js image as the base image
FROM node:22.11.0

# Set the working directory inside the container
WORKDIR /app

# Copy only package.json and package-lock.json first (for better caching)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the entire project into the container
COPY . .

# Expose the port Vite runs on (default: 5173)
EXPOSE 5173

# Command to run Vite development server
CMD ["npm", "run", "dev", "--", "--host"]
