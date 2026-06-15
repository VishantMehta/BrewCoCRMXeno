const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { getSegmentCustomerIds } = require('../services/segmentEngine');
const router = express.Router();

const prisma = new PrismaClient();

const CHANNEL_SERVICE_URL = process.env.CHANNEL_SERVICE_URL || 'http://localhost:3002';

router.get('/', async (req, res, next) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      include: {
        segment: true,
        _count: {
          select: { communicationLogs: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(campaigns);
  } catch (error) {
    next(error);
  }
});

router.get('/:id/stats', async (req, res, next) => {
  try {
    const campaignId = parseInt(req.params.id);
    
    const stats = await prisma.communicationLog.groupBy({
      by: ['status'],
      where: { campaign_id: campaignId },
      _count: { status: true }
    });

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { segment: true }
    });

    res.json({ campaign, stats });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, segment_id, message_template, channel } = req.body;
    
    const campaign = await prisma.campaign.create({
      data: { name, segment_id, message_template, channel }
    });

    res.json(campaign);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/launch', async (req, res, next) => {
  try {
    const campaignId = parseInt(req.params.id);
    
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { segment: true }
    });

    if (!campaign || campaign.status !== 'draft') {
      return res.status(400).json({ error: 'Campaign not found or already launched' });
    }

    const customerIds = await getSegmentCustomerIds(campaign.segment.rules_json);
    
    if (customerIds.length === 0) {
      return res.status(400).json({ error: 'Segment has no customers' });
    }

    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds } }
    });

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'launched', launched_at: new Date() }
    });

    const logsData = customers.map(c => {
      let msg = campaign.message_template.replace(/\{\{name\}\}/g, c.name);
      
      return {
        campaign_id: campaignId,
        customer_id: c.id,
        message: msg,
        channel: campaign.channel,
        status: 'pending'
      };
    });

    await prisma.communicationLog.createMany({
      data: logsData
    });

    const createdLogs = await prisma.communicationLog.findMany({
      where: { campaign_id: campaignId }
    });

    const payload = createdLogs.map(log => {
      const customer = customers.find(c => c.id === log.customer_id);
      return {
        log_id: log.id,
        recipient: customer.phone || customer.email,
        message: log.message,
        channel: log.channel
      };
    });

    fetch(`${CHANNEL_SERVICE_URL}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ communications: payload })
    }).catch(err => console.error('Failed to contact channel service:', err));

    res.json({ success: true, message: `Launched to ${customers.length} customers`, campaignId });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
