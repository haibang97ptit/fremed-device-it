// require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/devices',       require('./routes/devices'));
app.use('/api',               require('./routes/cardsAndIps'));
app.use('/api/lookup',        require('./routes/lookup'));
app.use('/api/ping',          require('./routes/ping'));
app.use('/api/quy-trinh',     require('./routes/quyTrinh'));
app.use('/api/tai-khoan',     require('./routes/taiKhoan'));
app.use('/api/phieu-de-nghi', require('./routes/phieuDeNghi'));
app.use('/api/qualzen',       require('./routes/qualzen'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Fremed Backend chạy tại http://localhost:${PORT}\n`);
});
