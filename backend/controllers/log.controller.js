'use strict';
const SpeedLog = require('../models/speedlog.model');

function getCategory(pct) {
  if (pct >= 90) return 'Best';
  if (pct >= 70) return 'Good';
  if (pct >= 50) return 'Average';
  return 'Poor';
}

exports.saveLog = async (req, res) => {
  try {
    const { userId, download, upload, latency, planDownload, planUpload } = req.body;

    if (!userId || download == null || upload == null || latency == null)
      return res.status(400).json({ success: false, message: 'Missing fields' });

    const planPct = planDownload > 0
      ? Math.min(100, Math.round((download / planDownload) * 100))
      : 0;

    const log = await SpeedLog.create({
      userId:         userId.toUpperCase(),
      download:       +parseFloat(download).toFixed(2),
      upload:         +parseFloat(upload).toFixed(2),
      latency:        Math.round(latency),
      category:       getCategory(planPct),
      planPercentage: planPct,
      planDownload:   planDownload || 0,
      planUpload:     planUpload   || 0
    });

    res.status(201).json({ success: true, log });
  } catch (err) {
    console.error('[log/save]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getLogs = async (req, res) => {
  try {
    const uid = req.params.userId.toUpperCase();
    if (req.user.userId !== uid)
      return res.status(403).json({ success: false, message: 'Forbidden' });

    const { category } = req.query;
    const filter = { userId: uid };
    if (category && ['Best','Good','Average','Poor'].includes(category))
      filter.category = category;

    const logs = await SpeedLog.find(filter).sort({ createdAt: -1 }).limit(100).lean();

    // Aggregate stats
    const all = await SpeedLog.find({ userId: uid }).lean();
    const stats = all.length ? {
      avgDownload: +(all.reduce((s,l)=>s+l.download,0)/all.length).toFixed(1),
      avgUpload:   +(all.reduce((s,l)=>s+l.upload,  0)/all.length).toFixed(1),
      avgLatency:  +(all.reduce((s,l)=>s+l.latency, 0)/all.length).toFixed(0),
      maxDownload: Math.max(...all.map(l=>l.download)),
      totalTests:  all.length
    } : null;

    // Category distribution
    const catCount = { Best:0, Good:0, Average:0, Poor:0 };
    all.forEach(l => catCount[l.category]++);

    res.json({ success: true, logs, stats, categoryDistribution: catCount });
  } catch (err) {
    console.error('[log/get]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteLog = async (req, res) => {
  try {
    const log = await SpeedLog.findById(req.params.id);
    if (!log) return res.status(404).json({ success: false });
    if (log.userId !== req.user.userId)
      return res.status(403).json({ success: false, message: 'Forbidden' });

    await log.deleteOne();
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
};
