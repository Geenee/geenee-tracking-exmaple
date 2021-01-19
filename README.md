# Stamp User Guide

### Create new project.

![ui_layers](https://eu-central-1-redbull-attachments-upload.geenee.io/attachments/7ca9f99b-92c5-4d74-9db8-c8f92bb1cfc2/fc78aa9b-be37-4fb6-973d-f73d2294aa30/ui_layers.png)

### Add dependencies.

```jsx
"dependencies": {
	...
	"@geenee/sdk-slam": "^1.0.4-alpha",
	...
}
```

### Import `loadWasm` and `stamp`.

```jsx
import '@geenee/sdk-slam';
const { slam, loadWasm } = Geenee;
```

### Initialize video stream.

### Load and Initialize WebAssembly.

```jsx
loadWasm().then(() => {
	// Initialize stamp here
	...
}
```

### Initialize Tracking.

Add event handlers.

```jsx
onStampUpdate(imageData: ImageData, targetID: number, rototranslation: [], focal: number) {
	// 1. Update matrix of overlay
	...
	// 2. Render video frame
	...
}

...

stamp.on('geenee-tracker-update', onStampUpdate)
```

Initialize stamp.

```jsx
stamp.initialize(video)
```

### Add Target.

```jsx
// load image here
const targetImageData: ImageData = someFunctionToLoadImage()
stamp.addTarget(targetImageData)
```

### Train Tracking.

```jsx
stamp.train()
```

### Recognize target in every frame

```jsx
onFrameUpdate() {
	requestAnimationFrame(onFrameUpdate)
	stamp.recognize(sceneWidth: number, sceneHeight: number)
}
```

### Update experience in every frame

```jsx
onStampUpdate(imageData: ImageData, targetID: number, rototranslation: [], focal: number) {
	// compute fov and update scene camera field of view
	const fov = 2.0 * Math.atan2(sceneHeight / 2.0, focal) * 180.0 / Math.PI
	// update camera field of view here
	...
	// update overlay/3D object transformation matrix
	...
	// draw video frame ImageData
	...
}
```
