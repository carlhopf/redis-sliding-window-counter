Redis Sliding Window Counter
---

Count twice, get count.

```javascript
import { increment, count } from 'redis-sliding-window-counter';

const id = `test-id-${Math.random()}`;
const iv = 10 * 1000;
const redis = createRedisClient();

await increment({ id, iv, redis });
await increment({ id, iv, redis });
    
const count = await count({ id, iv, redis });

assert.equal(count, 2);
```

Count twice, wait until expired, get count.

```javascript
import { increment, count } from 'redis-sliding-window-counter';

const id = `test-id-${Math.random()}`;
const iv = 10 * 1000;
const redis = createRedisClient();

await increment({ id, iv, redis });
await increment({ id, iv, redis });

// wait 11 seconds
await new Promise(r => setTimeout(r, iv + 1000))
    
const count = await count({ id, iv, redis });

assert.equal(count, 0);
```
