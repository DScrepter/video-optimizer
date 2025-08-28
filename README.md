# Video Optimizer

Electron приложение для оптимизации видео файлов.

## Локальная разработка

```bash
npm install
npm start
```

## Сборка

### Локальная сборка
```bash
# Windows
npm run build:win

# Mac (только на macOS)
npm run build:mac

# Linux
npm run build:linux

# Все платформы
npm run build:all
```

### Сборка через GitHub Actions

1. Закоммить и запушь изменения:
```bash
git add .
git commit -m "Update build configuration"
git push origin main
```

2. Создай тег для релиза:
```bash
git tag v1.0.0
git push origin v1.0.0
```

3. Или запусти сборку вручную:
   - Иди в GitHub → Actions → Build and Release → Run workflow

## Релизы

При создании тега `v*` автоматически запускается сборка под все платформы:
- macOS (DMG + ZIP)
- Windows (NSIS + ZIP)  
- Linux (AppImage + ZIP)

Готовые файлы будут доступны в GitHub Releases.

## Скачивания

### Последняя версия
Скачать последнюю версию: [GitHub Releases](https://github.com/[ТВОЙ_USERNAME]/video-optimizer/releases/latest)

### Быстрые ссылки (v1.0.2)
- **macOS**: [DMG установщик](https://github.com/[ТВОЙ_USERNAME]/video-optimizer/releases/download/v1.0.2/Video.Optimizer-1.0.0-arm64.dmg)
- **Windows**: [EXE установщик](https://github.com/[ТВОЙ_USERNAME]/video-optimizer/releases/download/v1.0.2/Video.Optimizer.Setup.1.0.0.exe)
- **Linux**: [AppImage](https://github.com/[ТВОЙ_USERNAME]/video-optimizer/releases/download/v1.0.2/Video.Optimizer-1.0.0.AppImage)

**Примечание:** Замени `[ТВОЙ_USERNAME]` на реальное имя пользователя GitHub

### Поддерживаемые платформы
- **macOS**: `.dmg` файл (10.14+, Apple Silicon + Intel)
- **Windows**: `.exe` установщик (Windows 10+)
- **Linux**: `.AppImage` (Ubuntu 18.04+, Fedora 28+)

## Структура проекта

- `main.js` - основной процесс Electron
- `renderer.js` - рендерер процесс
- `preload.js` - preload скрипт
- `index.html` - главная страница приложения
