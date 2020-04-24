import { nanoid } from 'nanoid';
import assert from 'assert';
import Redis from 'ioredis';
import * as SlidingWindowCounter from '../SlidingWindowCounter';

describe(__filename, function() {
  let redis;
  let id;
  let iv = 10 * 1000;

  before('redis create', function() {
    redis = createRedis();
  });

  beforeEach('prepare', function() {
    id = nanoid();
  });

  it('count 0', async function() {
    // older, outside interval window
    await SlidingWindowCounter.increment({
      id,
      iv,
      ts: Date.now() - iv * 2,
      redis,
    });

    let count = await SlidingWindowCounter.count({ id, iv, redis });
    assert.equal(count, 0);
  });

  it('count 3 after increments', async function() {
    // now
    await SlidingWindowCounter.increment({ id, iv, redis });
    await SlidingWindowCounter.increment({ id, iv, redis });

    // older, but still in interval window
    await SlidingWindowCounter.increment({
      id,
      iv,
      ts: Date.now() - iv / 2,
      redis,
    });

    // older, outside interval window
    await SlidingWindowCounter.increment({
      id,
      iv,
      ts: Date.now() - iv * 1.2,
      redis,
    });

    let count = await SlidingWindowCounter.count({ id, iv, redis });
    assert.equal(count, 3);
  });

  it('count 3, test expire', async function () {
    iv = 200;

    await SlidingWindowCounter.increment({ id, iv, redis });
    await SlidingWindowCounter.increment({ id, iv, redis });
    await SlidingWindowCounter.increment({ id, iv, redis });

    await new Promise(r => setTimeout(r, iv + 100));

    let count = await SlidingWindowCounter.count({ id, iv, redis });
    assert.equal(count, 0);
  })

  after('redis close', function() {
    if (redis) redis.disconnect();
  });
});

function createRedis() {
  var redis = new Redis.Cluster([{ host: 'localhost', port: 30001 }], {
    enableOfflineQueue: true,
    enableReadyCheck: true,
  });

  redis.on('error', (...args) => console.warn('redis error', ...args));

  return redis;
}
