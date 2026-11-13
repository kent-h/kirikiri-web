import Tokenize from "./tokenize"


const ignoreMacros = {cl_notrans: true}
// rep with lists (storages=, poss=…) comes from the port's sprite plugin; the game's rep macro doesn't know
// it, so like cl_notrans it goes to the renderer as it is
const isListRep = tag => tag.command === "rep" && tag.args.storages !== undefined

// macros test and pick their arguments ("mp") with TJS expressions, which are not run
// these handle the simple forms the game's macros use: comparisons of mp values joined by && and ||

// TJS treats a missing value (void) as equal to ""
const macroValue = (term, mp) => {
  const arg = /^mp\.(\w+)$/.exec(term)
  if (arg) {
    return mp[arg[1]] === undefined ? "" : String(mp[arg[1]])
  }
  if (term === "void") {
    return ""
  }
  const quoted = /^'([^']*)'$|^"([^"]*)"$/.exec(term)
  if (quoted) {
    return quoted[1] !== undefined ? quoted[1] : quoted[2]
  }
  if (/^-?\d+$/.test(term)) {
    return term
  }
  return undefined
}

// returns whether a macro argument condition holds, or undefined if it can't tell
export const evalMacroCondition = (cond, mp) => {
  let unknown = false
  const result = cond.split("||").some(either => either.split("&&").every(term => {
    const comparison = /^\s*(\S+?)\s*(===|!==|==|!=)\s*(\S+?)\s*$/.exec(term)
    const left = comparison && macroValue(comparison[1], mp)
    const right = comparison && macroValue(comparison[3], mp)
    if (left === undefined || right === undefined || left === null) {
      unknown = true
      return true
    }
    return comparison[2].startsWith("=") ? left === right : left !== right
  }))
  return unknown ? undefined : result
}

// resolves "&(mp.a!=void?mp.b:mp.c)" style values, undefined if it isn't one
const evalMacroValue = (value, mp) => {
  const choice = /^&\((.+?)\?mp\.(\w+):mp\.(\w+)\)$/.exec(value)
  if (!choice) {
    return undefined
  }
  const cond = evalMacroCondition(choice[1], mp)
  return cond === undefined ? undefined : mp[cond ? choice[2] : choice[3]]
}

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
    if (!(tag.command in ignoreMacros) && !isListRep(tag)) {
      tokens.push(tag)
      const macro = gameState.macros[tag.command]
      return macro.some(macroCommand => {
        let cmd = macroCommand
        if (macroCommand.type !== "t") {
          const args = Object.assign({}, macroCommand.args)
          // handle '%value' arguments
          Object.keys(macroCommand.args).forEach(key => {
            const value = macroCommand.args[key]
            if (typeof value === "string" && value.startsWith("%")) {
              let val = tag.args[value.substring(1)]
              if (val === undefined) {
                val = tag.args[key]
              }
              if (val !== undefined) {
                args[key] = val
              } else {
                delete args[key]
              }
            }
          })
          // handle '&(...)' expressions of the macro's arguments
          Object.keys(args).forEach(key => {
            const value = args[key]
            if (typeof value === "string" && value.startsWith("&(mp.")) {
              const val = evalMacroValue(value, tag.args)
              if (val !== undefined) {
                args[key] = val
              }
            }
          })
          // skip commands whose condition on the macro's arguments is false
          if (typeof args.cond === "string" && args.cond.includes("mp.")) {
            if (evalMacroCondition(args.cond, tag.args) === false) {
              return false
            }
          }
          // handle '*' argument
          if (macroCommand.args["*"]) {
            delete args["*"]
            Object.keys(tag.args).forEach(key => {
              if (!args.hasOwnProperty(key)) {
                args[key] = tag.args[key]
              }
            })
          }

          cmd = {
            type: macroCommand.type,
            command: macroCommand.command,
            originalArgs: macroCommand.args, // only for debug printing
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

      // // TODO: re-enable jump statements once "cond" tests are implemented.  This was causing an infinite loop when
      // tokens.push({
      //   type: "call",
      //   gameState,
      //   storage: tag.args.storage || stackFrame.storage,
      //   target: tag.args.target && tag.args.target.substring(1),
      // })
      // return true
      break
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
      } else {
        tokens.push({type: "HCF"})
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
