const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const fs = require('fs');

// Определяем путь к ffmpeg в зависимости от окружения
function getFfmpegPath() {
	if (app.isPackaged) {
		// В production - ищем в extraResources
		const resourcePath = path.join(process.resourcesPath, 'ffmpeg-static');
		const platform = process.platform;
		const arch = process.arch;

		let ffmpegName = 'ffmpeg';
		if (platform === 'win32') ffmpegName = 'ffmpeg.exe';

		const ffmpegPath = path.join(resourcePath, ffmpegName);
		if (fs.existsSync(ffmpegPath)) {
			return ffmpegPath;
		}

		// Fallback - ищем в node_modules
		const nodeModulesPath = path.join(__dirname, '..', 'node_modules', 'ffmpeg-static', ffmpegName);
		if (fs.existsSync(nodeModulesPath)) {
			return nodeModulesPath;
		}
	} else {
		// В development - используем ffmpeg-static
		try {
			return require('ffmpeg-static');
		} catch {
			// Fallback
			const nodeModulesPath = path.join(__dirname, 'node_modules', 'ffmpeg-static', 'ffmpeg');
			if (fs.existsSync(nodeModulesPath)) {
				return nodeModulesPath;
			}
		}
	}

	throw new Error('FFmpeg не найден');
}

const ffmpegPath = getFfmpegPath();

let currentProcess = null;

function createWindow() {
	const win = new BrowserWindow({
		width: 700,
		height: 500,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false,
		}
	});
	win.loadFile('index.html');
}

app.whenReady().then(createWindow);

ipcMain.handle('select-file', async () => {
	const { canceled, filePaths } = await dialog.showOpenDialog({
		properties: ['openFile'],
		filters: [{ name: 'Видео', extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm'] }]
	});
	if (canceled) return null;
	return filePaths[0];
});

function getVideoDuration(inputPath) {
	try {
		const ffprobePath = ffmpegPath.replace(/ffmpeg(\.exe)?$/, 'ffprobe$1');
		const result = execSync(`"${ffprobePath}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`);
		return parseFloat(result.toString());
	} catch {
		return null;
	}
}

function runFfmpeg(args, onData) {
	return new Promise((resolve, reject) => {
		currentProcess = spawn(ffmpegPath, args);

		currentProcess.stderr.on('data', onData);

		currentProcess.on('close', code => {
			currentProcess = null;
			if (code === 0) resolve();
			else reject(new Error(`ffmpeg завершился с кодом ${code}`));
		});
	});
}

ipcMain.handle('cancel-optimization', () => {
	if (currentProcess) {
		currentProcess.kill('SIGINT');
		currentProcess = null;
	}
});

ipcMain.handle('optimize-video', async (event, inputPath, options) => {
	const baseName = path.basename(inputPath, path.extname(inputPath));
	const dir = path.dirname(inputPath);
	const outDir = path.join(dir, `optimized_${baseName}`);
	if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

	const tempFile = path.join(outDir, 'temp.mp4');

	const duration = getVideoDuration(inputPath) || 0;

	// Копируем оригинал в temp, чтобы избежать проблем с кодеками
	await runFfmpeg(['-y', '-i', inputPath, '-c', 'copy', tempFile], () => { });

	async function convertVideo(height, suffix, webmCRF, mp4CRF) {
		const webmFile = path.join(outDir, `${baseName}_${suffix}.webm`);
		const mp4File = path.join(outDir, `${baseName}_${suffix}.mp4`);

		const scaleFilter = `scale=trunc(oh*a/2)*2:${height},fps=24`;

		// WebM
		await runFfmpeg([
			'-y', '-i', tempFile,
			'-vf', scaleFilter,
			'-an',
			'-c:v', 'libvpx-vp9',
			'-b:v', '0',
			'-crf', webmCRF.toString(),
			webmFile
		], (data) => {
			event.sender.send('ffmpeg-progress', data.toString());
		});

		// MP4
		await runFfmpeg([
			'-y', '-i', tempFile,
			'-vf', scaleFilter,
			'-an',
			'-c:v', 'libx264',
			'-preset', 'veryslow',
			'-crf', mp4CRF.toString(),
			'-movflags', '+faststart',
			mp4File
		], (data) => {
			event.sender.send('ffmpeg-progress', data.toString());
		});
	}

	// Запускаем конвертацию с параметрами из options или по умолчанию
	await convertVideo(options.desktopHeight || 720, 'desktop', options.webmCRF || 32, options.mp4CRF || 28);
	await convertVideo(options.mobileHeight || 480, 'mobile', options.webmCRF || 32, options.mp4CRF || 28);

	// Постер
	const posterFile = path.join(outDir, 'poster.webp');
	await runFfmpeg([
		'-y', '-i', tempFile,
		'-ss', '1',
		'-vframes', '1',
		'-vf', `scale=trunc(oh*a/2)*2:${options.desktopHeight || 720}`,
		posterFile
	], (data) => {
		event.sender.send('ffmpeg-progress', data.toString());
	});

	fs.unlinkSync(tempFile);

	const htmlFile = path.join(outDir, 'video.html');
	const htmlContent = `
<video autoplay muted loop playsinline poster="poster.webp">
  <source src="${baseName}_mobile.webm" type="video/webm" media="(max-width: 767px)">
  <source src="${baseName}_mobile.mp4" type="video/mp4" media="(max-width: 767px)">
  <source src="${baseName}_desktop.webm" type="video/webm">
  <source src="${baseName}_desktop.mp4" type="video/mp4">
</video>
`;
	fs.writeFileSync(htmlFile, htmlContent);

	return { outDir, duration };
});

