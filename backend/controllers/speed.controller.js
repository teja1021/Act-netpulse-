'use strict';

// Pre-allocate a 128 KB chunk filled with a repeating pattern (no Math.random)
const CHUNK = Buffer.alloc(128 * 1024);
for (let i = 0; i < CHUNK.length; i++) CHUNK[i] = i & 0xFF;

/**
 * GET /api/speed/ping
 * Tiny endpoint — client measures round-trip time.
 */
exports.ping = (_req, res) => {
  res.set('Cache-Control', 'no-store, no-cache');
  res.json({ ok: true, t: Date.now() });
};

/**
 * GET /api/speed/download
 * Streams binary data continuously. Client measures bytes/sec.
 */
exports.download = (req, res) => {
  res.set({
    'Content-Type':  'application/octet-stream',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma':        'no-cache',
    'Expires':       '0',
    'X-NP-Start':    String(Date.now())
  });

  let active = true;
  const MAX_MS = 15_000; // hard stop after 15 s
  const deadline = setTimeout(() => { active = false; res.end(); }, MAX_MS);

  const write = () => {
    if (!active) return;
    // Write chunks until the buffer is full, then wait for drain
    let ok = true;
    while (ok && active) {
      ok = res.write(CHUNK);
    }
    if (active && !ok) {
      res.once('drain', write);
    } else if (active) {
      setImmediate(write);
    }
  };

  req.on('close',  () => { active = false; clearTimeout(deadline); });
  res.on('close',  () => { active = false; clearTimeout(deadline); });
  res.on('finish', () => { active = false; clearTimeout(deadline); });

  write();
};

/**
 * POST /api/speed/upload
 * Accepts raw binary body — client measures how long it took to send.
 */
exports.upload = (req, res) => {
  let bytes = 0;
  const t0  = Date.now();

  req.on('data', chunk => { bytes += chunk.length; });

  req.on('end', () => {
    const elapsed = (Date.now() - t0) / 1000;
    res.set('Cache-Control', 'no-store');
    res.json({
      success: true,
      bytes,
      elapsed,
      mbps: elapsed > 0 ? +((bytes * 8) / (elapsed * 1e6)).toFixed(2) : 0
    });
  });

  req.on('error', () => res.status(500).json({ success: false }));
};
