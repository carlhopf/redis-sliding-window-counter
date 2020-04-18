Redis Sliding Window Counter
---

Count twice, get count.

```javascript
import { SlidingWindowCounter } from 'redis-sliding-window-counter';

const id = `test-id-${Math.random()}`;
const iv = 10 * 1000;
const redis = createRedisClient();

await SlidingWindowCounter.increment({ id, iv, redis });
await SlidingWindowCounter.increment({ id, iv, redis });
    
const count = await SlidingWindowCounter.count({ id, iv, redis });

assert.equal(count, 2);
```

Count twice, wait until expired, get count.

```javascript
import { SlidingWindowCounter } from 'redis-sliding-window-counter';

const id = `test-id-${Math.random()}`;
const iv = 10 * 1000;
const redis = createRedisClient();

await SlidingWindowCounter.increment({ id, iv, redis });
await SlidingWindowCounter.increment({ id, iv, redis });

// wait 11 seconds
await new Promise(r => setTimeout(r, iv + 1000))
    
const count = await SlidingWindowCounter.count({ id, iv, redis });

assert.equal(count, 0);
```
