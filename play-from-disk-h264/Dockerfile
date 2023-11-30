# Use an official Golang runtime as a parent image
FROM golang:latest

# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Build the Go application
RUN go build -o main

# Expose port 8080 to the outside world
EXPOSE 4000

# Run the executable
CMD ["./main"]
