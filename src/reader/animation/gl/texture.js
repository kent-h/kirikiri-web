export const tex = {
  newRenderTexture: function (gl, format) {
    const targetTexture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, targetTexture)

    // Create and bind the framebuffer
    const fb = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb)

    // attach the texture as the first color attachment
    const attachmentPoint = gl.COLOR_ATTACHMENT0
    gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, 0)

    let lastWidth = 0
    let lastHeight = 0

    return {
      bindAsTarget: (width, height) => {
        const change = width !== lastWidth || height !== lastHeight
        if (change) {
          lastWidth = width
          lastHeight = height

          // define size and format of level 0
          gl.bindTexture(gl.TEXTURE_2D, targetTexture)
          gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, format, gl.UNSIGNED_BYTE, null)

          // set the filtering so we don't need mips
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
        gl.viewport(0, 0, width, height)

        if (change) {
          gl.clearColor(0, 0, 0, 0)
          gl.clear(gl.COLOR_BUFFER_BIT)
        }
      },
      bindAsTexture: () => {
        gl.bindTexture(gl.TEXTURE_2D, targetTexture)
      },
    }
  },
}
