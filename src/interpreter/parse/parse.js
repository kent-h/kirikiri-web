import React from "react"
import Interpreter from "../interpreter"
import Anchor from "./anchor/anchor"
import Background from "./background/background"
import Tag from "./tag/tag"

const Parse = (props) => {
  let stackFrame = props.stackFrame
  let target = props.target

  if (target) {
    for (; stackFrame.lineIndex < stackFrame.lines.length; stackFrame.lineIndex++) {
      if (stackFrame.lines[stackFrame.lineIndex].startsWith(target)) {
        break
      }
    }
  }

  let toDisplay = []
  loop:
    for (; stackFrame.lineIndex < stackFrame.lines.length; stackFrame.lineIndex++) {
      let line = stackFrame.lines[stackFrame.lineIndex].trim()
      switch (line.charAt(0)) {
        case ";":
          // console.log(line) // ignore comments in general
          break
        case "*":
          // link
          toDisplay.push(<Anchor name={line}/>)
          break
        case "@":
          // command
          const command = ParseCommand(line, 0)
          if (InterpretCommand(toDisplay, props.gameState, command, stackFrame)) {
            break loop
          }
          break
        default:
          // regular text
          if (ParseInlineTags(toDisplay, props.gameState, line, stackFrame)) {
            break loop
          }
      }
    }

  if (stackFrame.lineIndex >= stackFrame.lines.length) {
    toDisplay.push(<div>--- end of {stackFrame.storage} ---</div>)
  }
  return toDisplay
}

// InterpretCommand interprets the given command, and pauses execution of the
const InterpretCommand = (toDisplay, gameState, command, stackFrame) => {
  if (stackFrame.macroBuilder) { // if we're building a macro, just add commands to the macro
    const macroBuilder = stackFrame.macroBuilder
    if (command.command === "endmacro") {
      toDisplay.push(<Tag command={command}/>)
      if (macroBuilder.name === "pgnl") {
        console.log(stackFrame.storage, stackFrame.lineIndex, macroBuilder.name, macroBuilder.macro, macroBuilder.macro.map(cmd => cmd.command).join(" "))
      }
      gameState.macros[macroBuilder.name] = macroBuilder.macro
      stackFrame.macroBuilder = false
    } else {
      macroBuilder.macro.push(command)
      if (command.type !== "t") {
        toDisplay.push(<div style={{color: "darkred", marginLeft: "2em"}}><Tag command={command}/></div>)
      }
    }
    return false
  }

  if (command.type === "t") {
    toDisplay.push(<div>{command.text}</div>)
    return false
  }

  if (command.command in gameState.macros) { // if a macro, run each command in the macro
    const macro = gameState.macros[command.command]
    return macro.some(macroCommand => {
      let cmd = macroCommand
      if (macroCommand.type !== "t") {
        const args = Object.assign({}, macroCommand.args)
        // handle '*' argument
        if (macroCommand.args["*"]) {
          Object.assign(args, macroCommand.args)
        } else {
          // handle '%value' arguments
          Object.keys(args).forEach(key => {
            const value = args[key]
            if (value.startsWith("%")) {
              args[key] = command.args[value.substring(1)]
            }
          })
        }

        cmd = {
          type: macroCommand.type,
          command: macroCommand.command,
          args: args,
        }
      }
      return InterpretCommand(toDisplay, gameState, cmd, stackFrame)
    })
  }

  switch (command.command.toLowerCase()) {
    case "imageex":
    case "image":
      toDisplay.push(<Background image={command.args.storage} folder="bgimage/"/>)
      break
    case "ld":
      toDisplay.push(<Background image={command.args.file} folder="fgimage/"/>)
      break
    case "fadein":
      toDisplay.push(<Background image={command.args.file} folder="bgimage/"/>)
      break
    case "jump":
      toDisplay.push(<Tag command={command}/>)

      stackFrame.lineIndex++
      toDisplay.push(<Interpreter gameState={gameState}
                                  storage={command.args.storage || stackFrame.storage}
                                  target={command.args.target}/>)
      return true
    case "call":
      toDisplay.push(<Tag command={command}/>)
      stackFrame.lineIndex++
      toDisplay.push(<Interpreter gameState={gameState}
                                  storage={command.args.storage || stackFrame.storage}
                                  target={command.args.target}
                                  returnFrame={stackFrame}/>)
      return true
    case "return":
      if (stackFrame.returnFrame) {
        toDisplay.push(<div>--- returning from {stackFrame.storage} ---</div>)
        toDisplay.push(<Parse gameState={gameState} stackFrame={stackFrame.returnFrame}/>)
      }
      return true
    case "iscript":
      // skip lines until end of script
      for (; stackFrame.lineIndex < stackFrame.lines.length; stackFrame.lineIndex++) {
        let line = stackFrame.lines[stackFrame.lineIndex]
        if (line === "[endscript]" || line === "@endscript") {
          break
        }
      }
      break
    case "macro":
      toDisplay.push(<Tag command={command}/>)
      // start building macro
      stackFrame.macroBuilder = {name: command.args.name, macro: []}
      break
    case "erasemacro":
      toDisplay.push(<Tag command={command}/>)
      delete gameState.macros[command.args.name]
      break
    case "s":
      toDisplay.push("--- page generation halted at [s] ---")
      return true
    default:
      toDisplay.push(<Tag command={command}/>)
  }
  return false
}

const ParseCommand = (tag, startAt) => {
  const commandRegex = /([@[])([^\s\]]+)/g
  const argsRegex = /\s*(?:([^\s=]+)=('[^']*'|"[^"]*"|[^\s'"\]]+)|(\*))/g

  commandRegex.lastIndex = startAt
  let commandMatch = commandRegex.exec(tag)

  if (!commandMatch) {
    return {command: "unable to match: '" + tag + "'", args: {}, lastIndex: startAt}
  }

  let lastIndex = commandRegex.lastIndex
  argsRegex.lastIndex = commandRegex.lastIndex

  let args = {}
  let arg
  while ((arg = argsRegex.exec(tag)) !== null) {
    if (arg[3]) {
      args["*"] = true
    } else {
      args[arg[1]] = arg[2]
    }
    lastIndex = argsRegex.lastIndex
  }

  return {type: commandMatch[1], command: commandMatch[2], args: args, lastIndex: lastIndex}
}

const ParseInlineTags = (toDisplay, gameState, line, stackFrame) => {
  const tagRegex = /([^[]*)(\[?)/g // read until there's a '[' character
  let tag
  while ((tag = tagRegex.exec(line)) !== null) {
    if (InterpretCommand(toDisplay, gameState, {type: "t", text: tag[1]}, stackFrame)) {
      return true
    }
    if (tag[2]) { // if the last character was '['
      let command = ParseCommand(line, tagRegex.lastIndex - 1)
      tagRegex.lastIndex = command.lastIndex + 1

      if (InterpretCommand(toDisplay, gameState, command, stackFrame)) {
        return true
      }
    } else {
      break
    }
  }
  return false
}

export default Parse