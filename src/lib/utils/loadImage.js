/**
 * @prettier
 */

/**
 * @function loadImage
 * @param {String} src
 * @param {any} canvas_id
 * @param {number} maxTargetDim
 */
async function loadImage(src, canvas_id, maxTargetDim) {
	// Load image
	const imgBlob = await fetch(src).then(resp => resp.blob())
	const img = await createImageBitmap(imgBlob)

	// Make canvas same size as image
	const canvas = document.createElement('canvas')
	canvas.id = canvas_id
	var scale = 1.0
	if (img.width > maxTargetDim) {
		scale = maxTargetDim / img.width
	}
	// Disabled as we cast to same canvas already created from `Canvas.jsx`
	// document.body.appendChild(canvas);
	if (img.height > maxTargetDim) {
		var sc2 = maxTargetDim / img.height
		if (sc2 < scale) scale = sc2
	}
	if (scale < 1.0) {
		canvas.width = img.width * scale
		canvas.height = img.height * scale
	} else {
		canvas.width = img.width
		canvas.height = img.height
	}

	// Draw image onto canvas
	const ctx = canvas.getContext('2d')
	ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
	return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

export default loadImage
