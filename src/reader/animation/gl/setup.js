import {m3} from "./matrix"
import resizeWatcher from "./resize"
import {Shader} from "./shader"
import {Sprite} from "./sprite"
import {tex} from "./texture"


const vertexShaderSource = `
// defined per-vertex
attribute vec2 a_position;
attribute vec2 a_texCoord;

// constant for whole batch
uniform mat3 u_matrix;

// to fragment shader
varying vec2 v_texCoord;

void main() {
  v_texCoord = a_texCoord;
  gl_Position = vec4(u_matrix * vec3(a_position, 1), 1);
}`

const fragmentShaderSource = `
// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default
precision mediump float;

// our texture
uniform sampler2D u_image;

// from vertex shader
varying vec2 v_texCoord;

void main() {
  gl_FragColor = texture2D(u_image, v_texCoord);
}`


const setupGL = (canvas) => {
  if (!canvas) {
    return
  }
  const gl = canvas.getContext("webgl")
  if (!gl) {
    return
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true) // ensure textures are right-way-up

  gl.enable(gl.BLEND)
  gl.enable(gl.CULL_FACE)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

  // watch for screen resize
  const displayWatcher = resizeWatcher(gl.canvas)

  // compile & link shader program
  const program = Shader.createProgram(gl)
    .add(gl.VERTEX_SHADER, vertexShaderSource)
    .add(gl.FRAGMENT_SHADER, fragmentShaderSource)
    .link()

  const spriteQuad = Sprite.setupQuad(gl)

  const sprites = {}

  const renderTexture = tex.newRenderTexture(gl)

  // code above this line is initialization code.
  // code below this line is rendering code.

  const render = () => {
    displayWatcher.resizeCanvasToDisplaySize()

    let texWidth = gl.canvas.width
    let texHeight = gl.canvas.height
    if (Math.abs(gl.canvas.width * 6 - gl.canvas.height * 8) >= 2 || Math.abs(gl.canvas.width * 6 / gl.canvas.height * 8) >= 0.2) {
      if (gl.canvas.width * 6 > gl.canvas.height * 8) {
        texWidth = Math.round(gl.canvas.height * 8 / 6)
        // gl.viewport((gl.canvas.width - gl.canvas.height * 8 / 6) / 2, 0, gl.canvas.height * 8 / 6, gl.canvas.height)
      } else {
        texHeight = Math.round(gl.canvas.width * 6 / 8)
        // gl.viewport(0, gl.canvas.height - gl.canvas.width * 6 / 8, gl.canvas.width, gl.canvas.height)
      }
    }

    // render to texture
    renderTexture.bindAsTarget(texWidth, texHeight)

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    // Tell it to use our program (pair of shaders)
    program.bind()

    spriteQuad.bind(program.a.position, program.a.texCoord)


    Object.keys(sprites).forEach((name, i, list) => {
      const sprite = sprites[name]
      gl.bindTexture(gl.TEXTURE_2D, sprite.id)

      // Compute the matrices
      const matrix = m3.multiply(m3.translation(i / list.length, 0), sprite.bottom)

      // Set the matrix.
      gl.uniformMatrix3fv(program.u.matrix, false, matrix)

      // draw
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    })

    copyToScreen(gl, renderTexture, texWidth, texHeight, program)
  }

  const imageReady = (name, image) => {
    if (image.naturalWidth === 0) { // image failed to load
      return // don't create a texture
    }
    if (sprites[name]) {
      return // already exists
    }

    console.log("loading texture", name)

    sprites[name] = Sprite.load(gl, image)

    requestRedraw()
  }

  let paused = true
  let animationFrame
  const animate = () => {
    render()
    if (!paused) {
      animationFrame = requestAnimationFrame(animate)
    }
  }
  animate()

  const requestRedraw = () => {
    if (paused) {
      render()
    }
  }

  displayWatcher.start(requestRedraw)

  const shutdown = () => {
    console.log("halted")
    cancelAnimationFrame(animationFrame)
    displayWatcher.stop()
  }


  return {shutdown, imageReady}
}

const copyToScreen = function (gl, renderTexture, texWidth, texHeight, program) {

  // render to screen
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)

  program.bind()

  renderTexture.bindAsTexture()

  gl.uniformMatrix3fv(program.u.matrix, false, m3.identity())

  // since the render texture is sized based on the screen, copy can be pixel-perfect
  // it is better to be off by half a pixel to the left or right, than to blur one pixel over the whole image
  const left = Math.round((gl.canvas.width - texWidth) / 2)

  if (texWidth < gl.canvas.width) {

    // draw left block
    const leftScale = texWidth / left
    gl.uniformMatrix3fv(program.u.matrix, false, m3.translate(m3.scale(m3.translation(-1, 0), leftScale >= 1 ? leftScale : 1, leftScale >= 1 ? 1 : 1 / leftScale), 1, 0))

    gl.viewport(0, gl.canvas.height - texHeight, left, texHeight)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    // draw right block
    const right = left + texWidth
    const rightWidth = gl.canvas.width - right
    const rightScale = texWidth / rightWidth
    gl.uniformMatrix3fv(program.u.matrix, false, m3.translate(m3.scale(m3.translation(1, 0), rightScale >= 1 ? rightScale : 1, rightScale >= 1 ? 1 : 1 / rightScale), -1, 0))

    gl.viewport(right, gl.canvas.height - texHeight, rightWidth, texHeight)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

  } else if (texHeight < gl.canvas.height) {

    // draw bottom block
    const bottomScale = texHeight / (gl.canvas.height - texHeight)
    gl.uniformMatrix3fv(program.u.matrix, false, m3.translate(m3.scale(m3.translation(0, -1), bottomScale >= 1 ? 1 : 1 / bottomScale, bottomScale >= 1 ? bottomScale : 1), 0, 1))

    gl.viewport(left, 0, texWidth, gl.canvas.height - texHeight)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  gl.uniformMatrix3fv(program.u.matrix, false, m3.identity())

  // draw main block
  gl.viewport(left, gl.canvas.height - texHeight, texWidth, texHeight)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
}

export default setupGL
