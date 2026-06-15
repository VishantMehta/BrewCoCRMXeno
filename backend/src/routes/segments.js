const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { previewSegment } = require('../services/segmentEngine');
const router = express.Router();

const prisma = new PrismaClient();

router.get('/', async (req, res, next) => {
  try {
    const segments = await prisma.segment.findMany({
      orderBy: { created_at: 'desc' }
    });
    res.json(segments);
  } catch (error) {
    next(error);
  }
});

router.post('/preview', async (req, res, next) => {
  try {
    const { rules_json } = req.body;
    const preview = await previewSegment(rules_json);
    res.json(preview);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, description, rules_json, created_by_ai } = req.body;
    
    const rulesStr = typeof rules_json === 'object' ? JSON.stringify(rules_json) : rules_json;

    const segment = await prisma.segment.create({
      data: {
        name,
        description,
        rules_json: rulesStr,
        created_by_ai: !!created_by_ai
      }
    });

    res.json(segment);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
