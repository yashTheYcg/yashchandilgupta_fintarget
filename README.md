
## API Reference


## Redis Configuration
```http
const Redis = require('ioredis');
const client = new Redis({
  host: process.env.REDIS_URL,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

```

## Npm Packages / Package.json file
```http
 {
    "body-parser": "^1.20.2",
    "bull": "^4.16.2",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "fs": "^0.0.1-security",
    "ioredis": "^5.4.1",
    "nodemon": "^3.1.4",
    "redis": "^4.7.0"
  }
```

## Baseurl 
```http
http://localhost:3000/
```

## Signup 

**Request:**
```json
POST /api/v1/task HTTP/1.1
Accept: application/json
Content-Type: application/json

{
    "userId": "user1"
}
```
**Response:**
```json
{
  "message": "Task submitted"
}
```



