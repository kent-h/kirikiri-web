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

const blurVertexShaderSource = `
// defined per-vertex
attribute vec2 a_position;
attribute vec2 a_texCoord;

// constant for whole batch
uniform mat3 u_matrix;

varying vec2 v_texCoord;

void main() {
  v_texCoord = a_texCoord;
  gl_Position = vec4(u_matrix * vec3(a_position, 1), 1);
}`

const blurFragmentShaderSource = `
// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default
precision mediump float;

// our texture
uniform sampler2D u_image;

// from vertex shader
varying vec2 v_texCoord;

void main() {
  gl_FragColor = (texture2D(u_image, v_texCoord.yx)+ texture2D(u_image, v_texCoord.yx+vec2(0.0 , 8.0/800.0)) )*0.5;
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

  const blurPassProgram = Shader.createProgram(gl)
    .add(gl.VERTEX_SHADER, blurVertexShaderSource)
    .add(gl.FRAGMENT_SHADER, blurFragmentShaderSource)
    .link()

  const sprites = {}

  const renderTexture = tex.newRenderTexture(gl, gl.RGB)
  const blurTexture = tex.newRenderTexture(gl, gl.RGB)

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

    copyToScreen(gl, renderTexture, blurTexture, texWidth, texHeight, program, blurPassProgram)
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

const copyToScreen = function (gl, renderTexture, blurTexture, texWidth, texHeight, program, blurPassProgram) {

  // since the render texture is sized based on the screen, copy can be pixel-perfect
  // it is better to be off by half a pixel to the left or right, than to blur one pixel over the whole image
  const leftWidth = Math.round((gl.canvas.width - texWidth) / 2)

  // render to screen
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  program.bind()
  renderTexture.bindAsTexture()

  gl.uniformMatrix3fv(program.u.matrix, false, m3.identity())

  // draw main block
  gl.viewport(leftWidth, gl.canvas.height - texHeight, texWidth, texHeight)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

  if (texWidth < gl.canvas.width) {

    // render blur first pass to other texture
    blurTexture.bindAsTarget(texHeight, texWidth) // flip coordinates
    blurPassProgram.bind()
    renderTexture.bindAsTexture()

    gl.uniformMatrix3fv(blurPassProgram.u.matrix, false, m3.identity())
    gl.viewport(0, 0, texHeight, texWidth) // flip coordinates
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)


    // render to screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    blurPassProgram.bind()
    blurTexture.bindAsTexture()


    // draw left block
    const leftScale = texWidth / leftWidth
    gl.uniformMatrix3fv(blurPassProgram.u.matrix, false, m3.translate(m3.scale(m3.translation(-1, 0), leftScale >= 1 ? leftScale : 1, leftScale >= 1 ? 1 : 1 / leftScale), 1, 0))

    gl.viewport(0, gl.canvas.height - texHeight, leftWidth, texHeight)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    // draw right block
    const right = leftWidth + texWidth
    const rightWidth = gl.canvas.width - right
    const rightScale = texWidth / rightWidth
    gl.uniformMatrix3fv(blurPassProgram.u.matrix, false, m3.translate(m3.scale(m3.translation(1, 0), rightScale >= 1 ? rightScale : 1, rightScale >= 1 ? 1 : 1 / rightScale), -1, 0))

    gl.viewport(right, gl.canvas.height - texHeight, rightWidth, texHeight)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

  } else if (texHeight < gl.canvas.height) {

    // render to screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    program.bind()

    renderTexture.bindAsTexture()

    gl.uniformMatrix3fv(program.u.matrix, false, m3.identity())

    // draw bottom block
    const bottomScale = texHeight / (gl.canvas.height - texHeight)
    gl.uniformMatrix3fv(program.u.matrix, false, m3.translate(m3.scale(m3.translation(0, -1), bottomScale >= 1 ? 1 : 1 / bottomScale, bottomScale >= 1 ? bottomScale : 1), 0, 1))

    gl.viewport(leftWidth, 0, texWidth, gl.canvas.height - texHeight)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }
}

const blurConvolution = (width, deviation) => {
  const blurAmount = (x, deviation) => {
    const dev2 = 2 * deviation * deviation
    return Math.exp(-x * x / dev2) / Math.sqrt(Math.PI * dev2)
  }

  let limitDistance = Math.ceil(deviation * 3)

  const weightsPerPixel = []
  for (let i = -limitDistance; i <= limitDistance; i++) {
    weightsPerPixel.push(blurAmount(i, deviation))
  }

  const offsets = []
  const weights = []
  for (let i = 0; i < weightsPerPixel.length; i += 2) {
    const distance = -limitDistance + i
    const combinedWeight = weightsPerPixel[i] + weightsPerPixel[i + 1]
    offsets.push((distance + combinedWeight * 0.5) / width)
    weights.push(combinedWeight)
  }
  offsets.push(limitDistance / width)
  weights.push(weightsPerPixel[-1])

  return {offsets, weights}
}

export default setupGL
