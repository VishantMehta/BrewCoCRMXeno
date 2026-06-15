@echo off
echo ==============================================
echo  Xeno CRM - Start Script
echo ==============================================
echo Launching 3 terminal windows for the services...

start "Xeno Backend" cmd /k "cd backend && npm run dev"
start "Xeno Channel Service" cmd /k "cd channel-service && npm run dev"
start "Xeno Frontend" cmd /k "cd frontend && npm run dev"

echo All services launched!
echo The Frontend should open in your browser shortly at http://localhost:3000
