@echo off
echo ========================================
echo  Fremed Backend - Chạy trên Windows
echo  (Hỗ trợ ping thiết bị qua VPN/LAN)
echo ========================================
echo.

cd /d "%~dp0backend"

set NODE_ENV=development
set PORT=3000
set DATABASE_URL=postgresql://fremed:fremed@2025@localhost:5432/fremed_device
set JWT_SECRET=fremed_secret_key_2025
set JWT_EXPIRES_IN=8h

echo [1/2] Cài đặt dependencies...
call npm install

echo.
echo [2/2] Khởi động backend...
echo.
node src/index.js
