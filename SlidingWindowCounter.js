const RKEY_PREFIX = `sld-win-ctr-`;
const INTERVAL_DEFAULT = 60 * 1000;

// inspired by
// https://www.figma.com/blog/an-alternative-approach-to-rate-limiting/
// -> Sliding Window Counter

// interval window is subdivided into parts,
// each part has own counter key on redis
// (figma.com recommends 60, but 30 should have enough precision)
const INTERVAL_WINDOW_SUBDIVIDE = 30;

function getKey(id, bucket) {
  return `{${RKEY_PREFIX}-${id}}-${bucket}`;
}

/**
 * Increment counter for @id, with @ts defaulting to Date.now()
 */
export async function increment({
  id,
  ts = Date.now(),
  iv = INTERVAL_DEFAULT,
  redis,
}) {
  const bucket = Math.floor(ts / (iv / INTERVAL_WINDOW_SUBDIVIDE));
  const key = getKey(id, bucket);

  let multi = redis.multi();
  multi.incr(key);
  multi.pexpire(key, iv * 2);

  await multi.exec();
}

/**
 * Get count of increment()s for @id, within last @iv milliseconds.
 */
export async function count({ id, iv = INTERVAL_DEFAULT, redis }) {
  const ts = Date.now();

  let multi = redis.multi();

  // get count for each sliding window subdivision bucket
  for (var i = 0; i < INTERVAL_WINDOW_SUBDIVIDE; i++) {
    let bucket = Math.floor(ts / (iv / INTERVAL_WINDOW_SUBDIVIDE)) - i;
    multi.get(getKey(id, bucket));
  }

  let result = await multi.exec();
  let count = 0;

  // sum counts for all buckets
  for (let [, bucketCount] of result) {
    if (bucketCount === null) continue;
    count += parseInt(bucketCount, 10);
  }

  return count;
}

export default {
  increment,
  count,
}
