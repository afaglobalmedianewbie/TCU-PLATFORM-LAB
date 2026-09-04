// routes/auth.js — autentikasi JWT untuk TCU-PLATFORM-V10
'use strict';

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../modules/db');
const { requireAuth } = require('../modules/auth-middleware');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password diperlukan', code: 'VALIDATION_ERROR' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Kredensial tidak valid', code: 'INVALID_CREDENTIALS' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Kredensial tidak valid', code: 'INVALID_CREDENTIALS' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({ token, role: user.role, expiresIn: JWT_EXPIRES });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh
router.post('/refresh', requireAuth, async (req, res) => {
  const token = jwt.sign(
    { sub: req.user.id, email: req.user.email, role: req.user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
  res.json({ token, expiresIn: JWT_EXPIRES });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, role: true, lastLoginAt: true, createdAt: true }
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
