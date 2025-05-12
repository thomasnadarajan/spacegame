# Deploying to EC2 with In-Memory Game State

This guide covers how to deploy the game to EC2 now that it's using in-memory state management instead of Redis.

## Prerequisites

- An AWS account with access to EC2
- Basic knowledge of EC2 instances and security groups
- Node.js installed on your local machine

## EC2 Instance Setup

1. **Launch an EC2 instance**:
   - Use Amazon Linux 2 or Ubuntu Server (recommended: t3.medium or larger for games with many players)
   - Configure security groups to allow:
     - SSH (port 22) from your IP
     - HTTP (port 80) from anywhere
     - HTTPS (port 443) from anywhere
     - Custom TCP on your game port (default: 8081) from anywhere

2. **Install Node.js on EC2**:

   For Amazon Linux 2:
   ```bash
   sudo yum update -y
   curl -sL https://rpm.nodesource.com/setup_16.x | sudo bash -
   sudo yum install -y nodejs
   ```

   For Ubuntu:
   ```bash
   sudo apt update
   sudo apt install -y curl
   curl -sL https://deb.nodesource.com/setup_16.x | sudo bash -
   sudo apt install -y nodejs
   ```

3. **Install PM2 for process management**:
   ```bash
   sudo npm install -g pm2
   ```

## Deployment

1. **Clone your repository**:
   ```bash
   git clone <your-repo-url>
   cd <your-repo-directory>
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the client**:
   ```bash
   npm run build
   ```

4. **Start the server with PM2**:
   ```bash
   pm2 start src/server/server.js --name "spacegame"
   ```

5. **Configure PM2 to restart on server reboot**:
   ```bash
   pm2 startup
   pm2 save
   ```

## Managing the Server

- **View logs**:
  ```bash
  pm2 logs spacegame
  ```

- **Monitor the process**:
  ```bash
  pm2 monit
  ```

- **Restart the server**:
  ```bash
  pm2 restart spacegame
  ```

## Scaling Considerations

Since the game state is now stored in memory on each EC2 instance, here are some scaling considerations:

### Single Instance Approach

The simplest approach is running the game on a single EC2 instance. This works well for:
- Games with fewer players (up to a few hundred)
- Less complex game states
- Games that don't require high availability

Advantages:
- Simplicity
- No need to synchronize state across instances
- Lower costs

### Scaling to Multiple Instances

If you need to scale beyond a single instance, you have several options:

1. **Sticky Sessions with Load Balancer**:
   - Set up an Application Load Balancer
   - Configure sticky sessions so each player stays on the same instance
   - Each instance maintains its own game state for its connected players

2. **Reimplement State Sharing**:
   - You could use AWS DynamoDB for persistent state
   - Use AWS ElastiCache if you want to return to a Redis-like approach
   - Implement WebSocket forwarding between instances for real-time updates

3. **Stateless Microservices**:
   - Refactor the game into stateless services
   - Move game state to a dedicated state management service

### Auto-Scaling Considerations

If implementing auto-scaling:
- Use a warm-up period for new instances
- Implement proper disconnect/reconnect handling
- Consider state transfer when scaling down

## Monitoring and Maintenance

- Set up CloudWatch alarms for:
  - CPU utilization
  - Memory usage
  - Network traffic
  
- Create a backup strategy for your EC2 instance
- Schedule regular maintenance windows for updates

## Troubleshooting

If you encounter issues:

1. Check server logs:
   ```bash
   pm2 logs spacegame
   ```

2. Verify the server is running:
   ```bash
   pm2 list
   ```

3. Test network connectivity:
   ```bash
   curl http://localhost:8081
   ```

4. Review EC2 security groups to ensure proper ports are open

5. Check EC2 instance health in the AWS console 