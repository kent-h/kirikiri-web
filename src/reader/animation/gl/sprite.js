import {m3} from "./matrix"

export const Sprite = {
  setupQuad: (gl) => {
    const coordinates = [
      0.0, 0.0,
      1.0, 0.0,
      0.0, 1.0,
      1.0, 1.0,
    ]
    const positions = coordinates.map(c => c * 2 - 1) // 0 => -1

    // create a buffer and put positions in it
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

    // create a buffer and texture coordinates in it
    const texCoordBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coordinates), gl.STATIC_DRAW)

    return {
      bind: (positionAttributeLocation, texCoordAttributeLocation) => {
        const size = 2          // 2 components per iteration
        const type = gl.FLOAT   // the data is 32bit floats
        const normalize = false // don't normalize the data
        const stride = 0        // 0 = move forward size * sizeof(type) each iteration to get the next position
        const offset = 0        // start at the beginning of the buffer

        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        gl.enableVertexAttribArray(positionAttributeLocation)
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
        gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset)

        // Tell the attribute how to get data out of texCoordBuffer (ARRAY_BUFFER)
        gl.enableVertexAttribArray(texCoordAttributeLocation)
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
        gl.vertexAttribPointer(texCoordAttributeLocation, size, type, normalize, stride, offset)
      },
    }
  },
  load: function (gl, image) {
    // Create a texture.
    const id = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, id)

    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)

    // Upload the image into the texture.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)

    const width = image.naturalWidth / 800, height = image.naturalHeight / 600

    const center = m3.scaling(width, height)
    const bottom = m3.translate(m3.scale(m3.translation(0, -1), width, height), 0, 1)

    return {id: id, center, bottom}
  }
}
