import Tokenize from "./tokenize"


const ignoreMacros = {cl_notrans: true}

// InterpretCommand interprets the given command, and pauses execution of the
const InterpretCommand = (tokens, gameState, tag) => {
  const stackFrame = gameState.stackFrame

  if (stackFrame.macroBuilder) { // if we're building a macro, just add commands to the macro
    const macroBuilder = stackFrame.macroBuilder
    if (tag.command === "endmacro") {
      tokens.push({type: "@", command: "macro", args: {name: macroBuilder.name}, tokens: macroBuilder.macro}) // for debug only, macros should be ignored in general
      gameState.macros[macroBuilder.name] = macroBuilder.macro
      stackFrame.macroBuilder = false
    } else {
      macroBuilder.macro.push(tag)
    }
    return false
  }

  if (tag.type === "t") {
    tokens.push(tag)
    return false
  }

  if (tag.command in gameState.macros) { // if a macro, run each command in the macro
    if (!(tag.command in ignoreMacros)) {
      tokens.push(tag)
      const macro = gameState.macros[tag.command]
      return macro.some(macroCommand => {
        let cmd = macroCommand
        if (macroCommand.type !== "t") {
          const args = Object.assign({}, macroCommand.args)
          // handle '%value' arguments
          Object.keys(args).forEach(key => {
            const value = args[key]
            if (typeof value === "string" && value.startsWith("%")) {
              args[key] = tag.args[value.substring(1)]
            }
          })
          // handle '*' argument
          if (macroCommand.args["*"]) {
            delete args["*"]
            Object.assign(args, tag.args)
          }

          cmd = {
            type: macroCommand.type,
            command: macroCommand.command,
            args: args,
            depth: (tag.depth || 0) + 1,
          }
        }
        return InterpretCommand(tokens, gameState, cmd, stackFrame)
      })
    }
  }

  switch (tag.command.toLowerCase()) {
    case "jump":
      tokens.push(tag)

      // gameState.stackFrame.storage = tag.args.storage || stackFrame.storage
      // gameState.stackFrame.target = tag.args.target
      tokens.push({
        type: "call",
        gameState,
        storage: tag.args.storage || stackFrame.storage,
        target: tag.args.target && tag.args.target.substring(1),
      })
      return true
    case "call":
      tokens.push(tag)

      gameState.stackFrame = {returnFrame: gameState.stackFrame}
      tokens.push({
        type: "call",
        gameState,
        storage: tag.args.storage || stackFrame.storage,
        target: tag.args.target && tag.args.target.substring(1),
      })
      return true
    case "return":
      if (stackFrame.returnFrame) {
        tokens.push(Object.assign({from: stackFrame.storage, to: stackFrame.returnFrame.storage}, tag))

        gameState.stackFrame = stackFrame.returnFrame
        Tokenize(tokens, gameState)
      }
      return true
    case "iscript":
      // skip to end of script tag
      const scriptRegex = /[^]*?\r?\n(?:@endscript|\[endscript])$/my
      const scriptStart = scriptRegex.lastIndex = stackFrame.fileIndex
      if (scriptRegex.exec(stackFrame.file)) {
        stackFrame.fileIndex = scriptRegex.lastIndex
        const scriptEnd = scriptRegex.lastIndex
        // console.log(stackFrame.file.substring(scriptStart, scriptEnd))
        tokens.push(Object.assign({file: stackFrame.file, scriptStart, scriptEnd}, tag))
      } else {
        throw new Error("unexpected end of file while skipping script")
      }
      break
    case "macro":
      // start building macro
      stackFrame.macroBuilder = {name: tag.args.name, macro: []}
      break
    case "erasemacro":
      tokens.push(tag)
      delete gameState.macros[tag.args.name]
      break
    case "s":
      tokens.push(tag)
      return true
    default:
      tokens.push(tag)
  }
  return false
}

export default InterpretCommand
