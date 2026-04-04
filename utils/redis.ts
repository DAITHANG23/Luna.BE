import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT) || 6379,
  username: 'default',
  password: process.env.REDIS_PASSWORD,
});
redis.on('connect', () => {
  console.log('✅ Connected to Redis!');
});

redis.on('error', err => {
  console.error('❌ Redis Error:', err);
});
export default redis;
