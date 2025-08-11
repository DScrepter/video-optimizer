const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
	selectFile: () => ipcRenderer.invoke('select-file'),
	optimizeVideo: (path, options) => ipcRenderer.invoke('optimize-video', path, options),
	cancelOptimization: () => ipcRenderer.invoke('cancel-optimization'),
	onFfmpegProgress: (callback) => ipcRenderer.on('ffmpeg-progress', (event, data) => callback(data))
});
