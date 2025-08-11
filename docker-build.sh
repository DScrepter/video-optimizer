#!/bin/bash

# Сборка для разных платформ через Docker
# Требует установленный Docker

echo "Сборка для Windows..."
docker run --rm -v "$(pwd):/app" -w /app electronuserland/builder:wine npm run dist -- --win

echo "Сборка для Linux..."
docker run --rm -v "$(pwd):/app" -w /app electronuserland/builder:latest npm run dist -- --linux

echo "Для macOS нужен реальный Mac или CI/CD сервис"

