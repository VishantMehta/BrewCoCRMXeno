@echo off
echo ==============================================
echo  Xeno CRM - Initial Setup Script
echo ==============================================

echo [1/4] Installing Backend Dependencies...
cd backend
call npm install
echo Pushing Prisma DB Schema...
call npx prisma db push
echo Seeding Database...
call npm run db:seed
cd ..

echo.
echo [2/4] Installing Channel Service Dependencies...
cd channel-service
call npm install
cd ..

echo.
echo [3/4] Installing Frontend Dependencies...
cd frontend
call npm install
cd ..

echo.
echo [4/4] Environment Variables...
echo Checking for backend/.env file...
if not exist "backend\.env" (
    echo Creating default .env file in backend...
    echo GEMINI_API_KEY="INSERT_YOUR_GEMINI_API_KEY_HERE" > backend\.env
    echo PORT=3001 >> backend\.env
    echo CHANNEL_SERVICE_URL="http://localhost:3002" >> backend\.env
    echo [WARNING] Please edit backend/.env and add your GEMINI_API_KEY.
) else (
    echo backend/.env already exists.
)

echo.
echo Setup Complete!
echo Run 'start.bat' to launch all services.
pause
