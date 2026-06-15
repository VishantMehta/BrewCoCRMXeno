const CRM_RECEIPT_URL = process.env.CRM_RECEIPT_URL || 'http://localhost:3001/api/receipts';

async function sendReceiptCallback(log_id, status, attempt = 1) {
  try {
    const response = await fetch(CRM_RECEIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ log_id, status, timestamp: new Date().toISOString() })
    });

    if (!response.ok) {
      throw new Error(`CRM returned ${response.status}`);
    }
  } catch (error) {
    if (attempt <= 3) {
      const backoff = Math.pow(2, attempt) * 1000;
      console.log(`Retry ${attempt} for log_id ${log_id} in ${backoff}ms...`);
      setTimeout(() => sendReceiptCallback(log_id, status, attempt + 1), backoff);
    } else {
      console.error(`Failed to send callback for log_id ${log_id} after 3 retries.`);
    }
  }
}

function processCommunications(communications) {
  communications.forEach(comm => {
    setTimeout(() => {
      sendReceiptCallback(comm.log_id, 'sent');

      setTimeout(() => {
        const isDelivered = Math.random() < 0.9;
        const deliveryStatus = isDelivered ? 'delivered' : 'failed';
        sendReceiptCallback(comm.log_id, deliveryStatus);

        if (isDelivered) {
          setTimeout(() => {
            const isOpened = Math.random() < 0.6;
            if (isOpened) {
              sendReceiptCallback(comm.log_id, 'opened');

              setTimeout(() => {
                const isClicked = Math.random() < 0.3;
                if (isClicked) {
                  sendReceiptCallback(comm.log_id, 'clicked');
                }
              }, Math.random() * 5000 + 1000);
            }
          }, Math.random() * 5000 + 1000);
        }
      }, Math.random() * 3000 + 500);

    }, Math.random() * 1000);
  });
}

module.exports = {
  processCommunications
};
