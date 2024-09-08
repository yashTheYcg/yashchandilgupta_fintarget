const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const path = require('path');
const Redis = require('ioredis');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, "./config.env") });

const client = new Redis({
  host: process.env.REDIS_URL,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

client.on('connect', () => {
  console.log('Connected to Redis...');
});

client.on('error', (err) => {
  console.error('Redis error:', err);
});

const app = express();
app.use(express.json());

const rateLimitWindow = 60; // 1 minute window for rate limiting
const rateLimitPerMinute = 20;

// Function to process tasks
async function processTasks() {
  while (true) {
    console.log("In the processTasks loop");
    try {
      const taskString = await client.brpop('taskQueue',4); // Block until a task is available
      if (!taskString) {
        console.log("No task available, waiting for 4 second...");
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before checking again
        continue; // If no task is available, continue the loop
      }

      const task = JSON.parse(taskString[1]);
      console.log(`Processing task for userId: ${task.userId} at ${new Date()}`);
      
      // Simulate task processing (e.g., sending an email, processing data)
      await new Promise(resolve => {
        console.log("Simulating task processing...");
        setTimeout(() => {
          console.log("Task processing complete.");
          resolve();
        }, 2000); // Simulate async work
      });
      
      console.log(`Task for userId: ${task.userId} completed.`);
      
      // Log task completion to a file (append mode)
      fs.appendFileSync('task_log.txt', `${task.userId}-task completed at-${Date.now()}\n`);
      
      // Yield control back to the event loop
      await new Promise(resolve => setImmediate(resolve));
    } catch (error) {
      console.error('Error processing task:', error);
    }
  }
}

app.post('/task', async (req, res) => {
  const userId = req.body.userId;
  const key = `user:${userId}:rateLimit`;

  try {
    console.log("Setting the rate limit");
    const currentCount = await client.incr(key);
    console.log("Current Count after incr:", currentCount); // Log the current count

    if (currentCount === 1) {
      await client.expire(key, rateLimitWindow); // Set expiration only when first increment
      console.log(`Rate limit key set for userId: ${userId} with expiration of ${rateLimitWindow} seconds.`);
    }

    console.log("Current Count:", currentCount);
    if (currentCount > rateLimitPerMinute) {
      return res.status(429).json({ message: 'Rate limit exceeded' });
    }

    console.log("Creating the task with userId and timestamp");
    const task = {
      userId,
      timestamp: Date.now(),
    };

    console.log("Pushing the task to Redis");
    await client.lpush('taskQueue', JSON.stringify(task));

    res.json({ message: 'Task submitted' });
  } catch (error) {
    console.error('Error processing task:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start processing tasks
processTasks();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await client.quit();
  console.log('Redis client closed');
  process.exit(0);
});

const server = http.createServer(app);
server.listen(3000, () => {
  console.log('Server listening on port 3000');
});