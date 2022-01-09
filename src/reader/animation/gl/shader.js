export const Shader = {
  createShader: function (gl, type, source) {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
    if (!success) {
      console.log(gl.getShaderInfoLog(shader))
      gl.deleteShader(shader)
    }

    return shader
  },
  createProgram: function (gl) {
    const program = gl.createProgram()
    const ret = {
      attach: (shader) => {
        gl.attachShader(program, shader)
        return ret
      },
      add: (type, source) => {
        return ret.attach(Shader.createShader(gl, type, source))
      },
      link: () => {
        gl.linkProgram(program)
        const success = gl.getProgramParameter(program, gl.LINK_STATUS)
        if (!success) {
          console.log(gl.getProgramInfoLog(program))
          gl.deleteProgram(program)
        }

        const attributes = {}, numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES)
        for (let i = 0; i < numAttributes; i++) {
          let info = gl.getActiveAttrib(program, i)
          let loc = gl.getAttribLocation(program, info.name)
          attributes[info.name.replace(/^a_/, "")] = loc
        }
        const uniforms = {}, numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
        for (let i = 0; i < numUniforms; i++) {
          let info = gl.getActiveUniform(program, i)
          let loc = gl.getUniformLocation(program, info.name)
          uniforms[info.name.replace(/^u_/, "")] = loc
        }

        return {
          u: uniforms,
          a: attributes,
          bind: () => gl.useProgram(program),
        }
      },
    }
    return ret
  },
}
