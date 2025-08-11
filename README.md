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

## Структура проекта

- `main.js` - основной процесс Electron
- `renderer.js` - рендерер процесс
- `preload.js` - preload скрипт
- `index.html` - главная страница приложения
