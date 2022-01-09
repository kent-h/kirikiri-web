// translated from https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html

const resizeWatcher = (canvas) => {
  // init with the default canvas size
  const canvasToDisplaySizeMap = new Map([[canvas, [80, 60]]])

  let resizeObserver
  const start = (onChange) => {
    const onResize = (entries) => {
      for (const entry of entries) {
        let width
        let height
        let dpr = window.devicePixelRatio
        if (entry.devicePixelContentBoxSize) {
          // NOTE: Only this path gives the correct answer
          // The other paths are imperfect fallbacks
          // for browsers that don't provide anyway to do this
          width = entry.devicePixelContentBoxSize[0].inlineSize
          height = entry.devicePixelContentBoxSize[0].blockSize
          dpr = 1 // it's already in width and height
        } else if (entry.contentBoxSize) {
          if (entry.contentBoxSize[0]) {
            width = entry.contentBoxSize[0].inlineSize
            height = entry.contentBoxSize[0].blockSize
          } else {
            width = entry.contentBoxSize.inlineSize
            height = entry.contentBoxSize.blockSize
          }
        } else {
          width = entry.contentRect.width
          height = entry.contentRect.height
        }
        const displayWidth = Math.round(width * dpr)
        const displayHeight = Math.round(height * dpr)
        canvasToDisplaySizeMap.set(entry.target, [displayWidth, displayHeight])
      }
      onChange()
    }

    resizeObserver = new ResizeObserver(onResize)
    try {
      // only call us of the number of device pixels changed
      resizeObserver.observe(canvas, {box: "device-pixel-content-box"})
    } catch (ex) {
      // device-pixel-content-box is not supported so fallback to this
      resizeObserver.observe(canvas, {box: "content-box"})
    }
  }

  const stop = () => {
    if (resizeObserver) {
      resizeObserver.disconnect()
    }
  }

  const resizeCanvasToDisplaySize = () => {
    // Get the size the browser is displaying the canvas in device pixels.
    const [displayWidth, displayHeight] = canvasToDisplaySizeMap.get(canvas)

    // Check if the canvas is not the same size.
    const needResize = canvas.width !== displayWidth || canvas.height !== displayHeight

    if (needResize) {
      // Make the canvas the same size
      canvas.width = displayWidth
      canvas.height = displayHeight
    }

    return needResize
  }

  return {start, stop, resizeCanvasToDisplaySize}
}

export default resizeWatcher

