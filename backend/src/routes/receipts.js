const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

router.post('/', async (req, res, next) => {
  try {
    const { log_id, status, timestamp } = req.body;

    if (!log_id || !status) {
      return res.status(400).json({ error: 'Missing log_id or status' });
    }

    const updateData = { status };
    const dateValue = timestamp ? new Date(timestamp) : new Date();

    if (status === 'sent') updateData.sent_at = dateValue;
    else if (status === 'delivered') updateData.delivered_at = dateValue;
    else if (status === 'opened') updateData.opened_at = dateValue;
    else if (status === 'clicked') updateData.clicked_at = dateValue;

    await prisma.communicationLog.update({
      where: { id: log_id },
      data: updateData
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Receipt update failed:', error);
    res.status(500).json({ error: 'Failed to process receipt' });
  }
});

module.exports = router;
