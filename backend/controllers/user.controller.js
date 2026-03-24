'use strict';
const User = require('../models/user.model');

exports.getUser = async (req, res) => {
  try {
    const uid = req.params.id.toUpperCase();
    if (req.user.userId !== uid)
      return res.status(403).json({ success: false, message: 'Forbidden' });

    const user = await User.findOne({ userId: uid }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const uid = req.params.id.toUpperCase();
    if (req.user.userId !== uid)
      return res.status(403).json({ success: false, message: 'Forbidden' });

    const { name, email, planName, isp, download, upload, city } = req.body;
    const update = {};
    if (name)     update.name         = name;
    if (email)    update.email        = email;
    if (planName) update['plan.name'] = planName;
    if (isp)      update['plan.isp']  = isp;
    if (download) update['plan.download'] = Number(download);
    if (upload)   update['plan.upload']   = Number(upload);
    if (city)     update['plan.city']     = city;

    const user = await User.findOneAndUpdate(
      { userId: uid },
      { $set: update },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
