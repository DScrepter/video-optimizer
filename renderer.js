const selectBtn = document.getElementById('select');
const cancelBtn = document.getElementById('cancel');
const status = document.getElementById('status');
const progress = document.getElementById('progress');
const log = document.getElementById('log');

const webmCRFInput = document.getElementById('webmCRF');
const mp4CRFInput = document.getElementById('mp4CRF');
const desktopHeightInput = document.getElementById('desktopHeight');
const mobileHeightInput = document.getElementById('mobileHeight');
const removeAudioInput = document.getElementById('removeAudio');

let videoDuration = 0;
let optimizing = false;

selectBtn.addEventListener('click', async () => {
	if (optimizing) return; // защита от повторных запусков

	status.textContent = '';
	progress.value = 0;
	log.textContent = '';
	cancelBtn.disabled = false;
	optimizing = true;

	const filePath = await window.electronAPI.selectFile();
	if (!filePath) {
		status.textContent = 'Файл не выбран';
		cancelBtn.disabled = true;
		optimizing = false;
		return;
	}
	status.textContent = `Выбран файл:\n${filePath}\nНачинаю оптимизацию...`;

	const options = {
		webmCRF: Number(webmCRFInput.value) || 32,
		mp4CRF: Number(mp4CRFInput.value) || 28,
		desktopHeight: Number(desktopHeightInput.value) || 720,
		mobileHeight: Number(mobileHeightInput.value) || 480,
		removeAudio: removeAudioInput.checked,
	};

	try {
		const result = await window.electronAPI.optimizeVideo(filePath, options);
		if (!result) {
			status.textContent = 'Оптимизация отменена или ошибка';
			return;
		}
		videoDuration = result.duration || 0;
		status.textContent = `Готово! Файлы сохранены в:\n${result.outDir}`;
		progress.value = 100;
	} catch (e) {
		status.textContent = `Ошибка или отмена: ${e.message}`;
	} finally {
		cancelBtn.disabled = true;
		optimizing = false;
	}
});

cancelBtn.addEventListener('click', () => {
	if (!optimizing) return;
	window.electronAPI.cancelOptimization();
	status.textContent = 'Отмена...';
	cancelBtn.disabled = true;
	optimizing = false;
});

window.electronAPI.onFfmpegProgress(data => {
	log.textContent += data;

	if (videoDuration > 0) {
		const timeMatch = data.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
		if (timeMatch) {
			const hours = +timeMatch[1];
			const minutes = +timeMatch[2];
			const seconds = +timeMatch[3];
			const centiseconds = +timeMatch[4];
			const currentTime = hours * 3600 + minutes * 60 + seconds + centiseconds / 100;

			let percent = (currentTime / videoDuration) * 100;
			if (percent > progress.value) {
				progress.value = percent;
			}
		}
	} else {
		progress.value = Math.min(progress.value + 1, 95);
	}

	log.scrollTop = log.scrollHeight;
});
