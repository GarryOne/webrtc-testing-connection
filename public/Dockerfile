# Use an official Node runtime as a parent image
FROM node:latest

# Set the working directory in the container
WORKDIR /usr/src/app

# Install http-server globally
RUN npm install -g http-server

# Copy the application files to the container
COPY index.html .
COPY client.js .
COPY style.css .

# Make port 8080 available to the world outside this container
EXPOSE 8080

# Run http-server when the container launches
CMD ["http-server", "-p 8080"]
