const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { processCommunications } = require('./simulator');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Channel Stub' });
});

app.post('/send', (req, res) => {
  const { communications } = req.body;
  
  if (!communications || !Array.isArray(communications)) {
    return res.status(400).json({ error: 'communications array required' });
  }

  res.status(202).json({ 
    message: `Accepted ${communications.length} communications for delivery` 
  });

  processCommunications(communications);
});

app.listen(PORT, () => {
  console.log(`Channel Service Stub listening on port ${PORT}`);
});
