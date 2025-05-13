const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const ipSessions = require('../ipSessions');
const sendResetEmail = require('../utils/sendResetEmail');

exports.register = async (req, res) => {
  const { username , email, password, phone, firstName, lastName } = req.body;
  const hashed = await bcrypt.hash(password, 10);

  try {
    const newUser = new User({ 
      username,
      email, 
      password: hashed,
      phone,
      firstName,
      lastName
    });
    await newUser.save();
    res.status(201).json({ message: 'Kayıt başarılı' });
  } catch (err) {
    res.status(400).json({ message: 'Kayıt başarısız', error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Kullanıcı bulunamadı' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Şifre yanlış' });

    if (ipSessions.isLoggedIn(ip)) {
      return res.status(403).json({ message: 'Bu IP adresinden zaten giriş yapılmış' });
    }

    ipSessions.login(ip, user._id);

    const token = jwt.sign({ userId: user._id }, "supersecretkey", { expiresIn: '1h' });
    res.json({ token, message: 'Giriş başarılı' });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};


exports.logout = (req, res) => {
  const ip = req.ip;
  ipSessions.logout(ip);
  res.json({ message: 'Çıkış başarılı' });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(400).json({ message: 'Kullanıcı bulunamadı' });

  const token = Math.random().toString(36).substring(2);
  user.resetToken = token;
  user.resetTokenExpire = Date.now() + 3600000; // 1 saat
  await user.save();

  // Dummy email function
  await sendResetEmail(email, token);

  res.json({ message: 'Şifre sıfırlama bağlantısı gönderildi' });
};
// Kullanıcı arama
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } }
      ]
    }).select('username firstName lastName profileImage');
    
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Takip işlemleri
exports.followUser = async (req, res) => {
  try {
    const { userId } = req;
    const { targetUserId } = req.params;

    // Kendini takip etmeyi engelle
    if (userId === targetUserId) {
      return res.status(400).json({ message: 'Kendini takip edemezsin' });
    }

    const [user, targetUser] = await Promise.all([
      User.findById(userId),
      User.findById(targetUserId)
    ]);

    if (!targetUser) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Çift takip önleme
    if (!user.following.includes(targetUserId)) {
      user.following.push(targetUserId);
      targetUser.followers.push(userId);
      await Promise.all([user.save(), targetUser.save()]);
    }

    res.json({ message: 'Takip işlemi başarılı' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const { userId } = req;
    const { targetUserId } = req.params;

    await Promise.all([
      User.findByIdAndUpdate(userId, { $pull: { following: targetUserId } }),
      User.findByIdAndUpdate(targetUserId, { $pull: { followers: userId } })
    ]);

    res.json({ message: 'Takipten çıkıldı' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    console.log('Requested user ID:', req.params.id); // ID doğru geliyor mu?
    const user = await User.findById(req.params.id).select('-password -resetToken -resetTokenExpire');
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    console.log('Found user:', user);
    res.json(user);
  } catch (err) {
    console.error('Error in getUserById:', err);
    res.status(500).json({ message: err.message });
  }
};
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password -resetToken -resetTokenExpire')
      .populate('followers', 'username firstName lastName profileImage')
      .populate('following', 'username firstName lastName profileImage');
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};