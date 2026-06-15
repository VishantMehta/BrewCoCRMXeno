const express = require('express');
const cors = require('cors');
require('dotenv').config();

const customersRouter = require('./routes/customers');
const segmentsRouter = require('./routes/segments');
const campaignsRouter = require('./routes/campaigns');
const aiRouter = require('./routes/ai');
const receiptsRouter = require('./routes/receipts');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CRM Backend is running' });
});

app.use('/api/customers', customersRouter);
app.use('/api/segments', segmentsRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/receipts', receiptsRouter);

app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

app.listen(PORT, () => {
  console.log(`CRM Backend listening on port ${PORT}`);
});
