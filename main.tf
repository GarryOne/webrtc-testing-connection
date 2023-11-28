# Define an ECS Task Definition for your container
resource "aws_ecs_task_definition" "example" {
  family                   = "example"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256" # Specify the desired CPU units
  memory                   = "512" # Specify the desired memory in MiB

  execution_role_arn = aws_iam_role.ecs_execution_role.arn

  container_definitions = jsonencode([{
    name  = "example-container"
    image = "your-docker-image:latest"
  }])
}

# Define an IAM role for ECS tasks
resource "aws_iam_role" "ecs_execution_role" {
  name = "ecs_execution_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

# Create an ECS cluster for each VPC
resource "aws_ecs_cluster" "building1_cluster" {
  name = "building1-cluster"
}

resource "aws_ecs_cluster" "building2_cluster" {
  name = "building2-cluster"
}

# Create a security group for your Fargate service
resource "aws_security_group" "ecs_sg" {
  name_prefix = "ecs-sg-"

  # You can define inbound and outbound rules here as needed
  # Example:
  # ingress {
  #   from_port   = 80
  #   to_port     = 80
  #   protocol    = "tcp"
  #   cidr_blocks = ["0.0.0.0/0"]
  # }
}

# Create an ECS service for each VPC using Fargate launch type
resource "aws_ecs_service" "building1_ecs_service" {
  name            = "building1-ecs-service"
  cluster         = aws_ecs_cluster.building1_cluster.id
  task_definition = aws_ecs_task_definition.example.arn
  launch_type     = "FARGATE"
  desired_count   = 1

  network_configuration {
    subnets = [aws_subnet.building1_subnet.id]
    security_groups = [aws_security_group.ecs_sg.id]
  }
}

resource "aws_ecs_service" "building2_ecs_service" {
  name            = "building2-ecs-service"
  cluster         = aws_ecs_cluster.building2_cluster.id
  task_definition = aws_ecs_task_definition.example.arn
  launch_type     = "FARGATE"
  desired_count   = 1

  network_configuration {
    subnets = [aws_subnet.building2_subnet.id]
    security_groups = [aws_security_group.ecs_sg.id]
  }
}
