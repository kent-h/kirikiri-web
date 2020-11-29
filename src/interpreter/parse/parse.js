import React, {Fragment} from "react"
import Interpreter from "../interpreter"
import Anchor from "./anchor/anchor"
import ScrollDetect from "./scroll/scroll"
import Tag from "./tag/tag"

const debug = false

const Parse = (props) => {
  const tokens = []
  Tokenize(tokens, props)

  const toDisplay = []
  const append = (Component) => {
    toDisplay.push(<Fragment key={toDisplay.length + 1}>{Component}</Fragment>)
  }

  let betweenText = []

  tokens.forEach(token => {
    switch (token.type) {
      case ";": // comment
        // console.log(token.text) // ignore comments in general
        break
      case "t": // text
        RenderChunk(betweenText, append)
        betweenText = []
        append(<span>{token.text}</span>)
        break
      case "*": // link
        betweenText.push(token)
        break
      case "@": // full-line tag
      case "[": // inline tag
        betweenText.push(token)
        break
      case "EOF":
        RenderChunk(betweenText, append)
        betweenText = []
        append(<div>--- end of {token.storage} ---</div>)
        break
      case "call": // jump or call statements require more page loading
        RenderChunk(betweenText, append)
        betweenText = []
        append(<Interpreter gameState={token.gameState}
                            storage={token.storage}
                            target={token.target}
                            returnFrame={token.returnFrame}/>)
        break
      default:
        console.log("warning: unhandled token type: " + token.type, token)
    }
  })
  return toDisplay
}

const RenderChunk = (tokens, append) => {
  let isDivider = false
  let backgroundFolder = null
  let background = null

  let time = 0
  let layers = []
  let transition = []
  let animation = []

  tokens.forEach(token => {
    switch (token.type) {
      case ";": // comment
        // console.log(token.text) // ignore comments in general
        break
      case "*": // link
        append(<Anchor name={token.link}/>)
        break
      case "@": // full-line tag
      case "[": // inline tag
        if (debug) {
          append(<Tag command={token}/>)
        }
        switch (token.command.toLowerCase()) {
          case "imageex":
          case "image":
          case "image4demo":
            isDivider = true
            layers[token.args.layer || 0] = {
              image: token.args.storage,
              folder: "bgimage/",
              animation: [{
                left: token.args.left || 0,
                top: token.args.top || 0,
              }],
            }
            background = token.args.storage
            backgroundFolder = "bgimage/"
            append(<Tag command={token} color="red"/>)
            // append(<ScrollDetect image={token.args.storage}
            //                      id={uuid++}
            //                      folder="bgimage/"
            //                      alt={token.command + " " + Object.keys(token.args).map(key => key === "*" ? " *" : " " + key + "=" + token.args[key]).join("")}/>)
            break
          case "fadein":
            isDivider = true
            layers[token.args.layer || 0] = {
              image: token.args.file,
              folder: "bgimage/",
              animation: [{
                left: 0,
                top: 0,
              }],
            }
            transition[token.args.layer || 0] = {method: token.args.method, time: token.args.time}
            background = token.args.file
            backgroundFolder = "bgimage/"
            append(<Tag command={token} color="red"/>)
            // append(<ScrollDetect image={token.args.file}
            //                      id={uuid++}
            //                      folder="bgimage/"
            //                      alt={token.command + " " + Object.keys(token.args).map(key => key === "*" ? " *" : " " + key + "=" + token.args[key]).join("")}/>)
            break
          case "move":
            const pathRegex = /\((\d+),(\d+),(\d+)\)/y // read as many as we have
            let node
            while ((node = pathRegex.exec(token.args.path)) !== null) {
              if (layers[token.args.layer || 0]) {
                layers[token.args.layer || 0].animation.push({
                  time: time + token.args.time,
                  left: parseInt(node[1], 10),
                  top: parseInt(node[2], 10),
                  opacity: parseInt(node[3], 10) / 255,
                })
              }
            }
            append(<Tag command={token} color="red"/>)
            break
          case "r":
            append(<div className="newline"/>)
            break
          case "cm":
            append(<div style={{height: "3em"}}/>)
            break
          case "macro":
            // on creation of a macro, there's nothing to render unless debugging
            if (debug) {
              append(<div style={{color: "darkred", marginLeft: "2em", border: "1px solid green"}}>
                {token.tokens.map(token => (<Tag command={token}/>))}
              </div>)
            }
            break
          case "return":
            append(<div>--- returning from {token.from} (to {token.to}) ---</div>)
            break
          case "s":
            append("--- page generation halted at [s] ---")
            break
          default:
        }
        break
      case "EOF":
        append(<div>--- end of {token.storage} ---</div>)
        break
      case "call": // jump or call statements require more page loading
        append(<Interpreter gameState={token.gameState}
                            storage={token.storage}
                            target={token.target}
                            returnFrame={token.returnFrame}/>)
        break
      default:
        console.log("warning: unhandled token type: " + token.type, token)
    }
  })

  if (isDivider) {
    // determine transition
    // determine reverse transition
    append(<ScrollDetect image={background}
                         id={uuid++}
                         folder={backgroundFolder}
                         layers={layers}
                         alt=""/>)
  }
}

const Tokenize = (tokens, props) => {
  let gameState = props.gameState
  let stackFrame = props.stackFrame
  let target = props.target

  if (target) {
    for (; stackFrame.lineIndex < stackFrame.lines.length; stackFrame.lineIndex++) {
      if (stackFrame.lines[stackFrame.lineIndex].startsWith(target)) {
        break
      }
    }
  }

  loop:
    for (; stackFrame.lineIndex < stackFrame.lines.length; stackFrame.lineIndex++) {
      let line = stackFrame.lines[stackFrame.lineIndex].trim()
      switch (line.charAt(0)) {
        case ";":
          tokens.push({type: ";", text: line})
          break
        case "*":
          // link
          tokens.push({type: "*", id: line})
          break
        case "@":
          // command
          const tag = ParseTag(line, 0)
          if (InterpretCommand(tokens, gameState, tag, stackFrame)) {
            break loop
          }
          break
        default:
          // regular text
          if (line.length !== 0) {
            if (ParseInlineTags(tokens, gameState, line, stackFrame)) {
              break loop
            }
          }
      }
    }

  if (stackFrame.lineIndex >= stackFrame.lines.length) {
    tokens.push({type: "EOF", storage: stackFrame.storage})
  }
}

let uuid = 1

const ignoreMacros = {cl_notrans: true}

// InterpretCommand interprets the given command, and pauses execution of the
const InterpretCommand = (tokens, gameState, tag, stackFrame) => {
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

      stackFrame.lineIndex++

      tokens.push({
        type: "call",
        gameState,
        storage: tag.args.storage || stackFrame.storage,
        target: tag.args.target,
      })
      return true
    case "call":
      tokens.push(tag)

      stackFrame.lineIndex++

      tokens.push({
        type: "call",
        gameState,
        storage: tag.args.storage || stackFrame.storage,
        target: tag.args.target,
        returnFrame: stackFrame,
      })
      return true
    case "return":
      if (stackFrame.returnFrame) {
        tokens.push(Object.assign({from: stackFrame.storage, to: stackFrame.returnFrame.storage}, tag))

        Tokenize(tokens, {gameState, stackFrame: stackFrame.returnFrame})
      }
      return true
    case "iscript":
      // skip lines until end of script
      const script = []
      for (stackFrame.lineIndex++; stackFrame.lineIndex < stackFrame.lines.length; stackFrame.lineIndex++) {
        let line = stackFrame.lines[stackFrame.lineIndex]
        if (line === "[endscript]" || line === "@endscript") {
          break
        } else {
          script.push(line)
        }
      }
      tokens.push(Object.assign({script}, tag))
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

const ParseTag = (tag, startAt) => {
  const tagRegex = /([@[])([^\s\]]+)/y
  const argsRegex = /\s*(?:([^\s=]+)=((?:'[^']*'|"[^"]*"|[^\s'"\]])+)|(\*))/y

  tagRegex.lastIndex = startAt
  let tagMatch = tagRegex.exec(tag)

  if (!tagMatch) {
    return {command: "unable to match: '" + tag + "'", args: {}, lastIndex: startAt}
  }

  let lastIndex = tagRegex.lastIndex
  argsRegex.lastIndex = tagRegex.lastIndex

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

  return {type: tagMatch[1], command: tagMatch[2], args: args, lastIndex: lastIndex}
}

const ParseInlineTags = (tokens, gameState, line, stackFrame) => {
  const tagRegex = /([^[]*)(\[?)/y // read until there's a '[' character
  let tag
  while ((tag = tagRegex.exec(line)) !== null) {
    if (tag[1].length !== 0) {
      if (InterpretCommand(tokens, gameState, {type: "t", text: tag[1]}, stackFrame)) {
        return true
      }
    }
    if (tag[2]) { // if the last character was '['
      let command = ParseTag(line, tagRegex.lastIndex - 1)
      tagRegex.lastIndex = command.lastIndex + 1

      if (InterpretCommand(tokens, gameState, command, stackFrame)) {
        return true
      }
    } else {
      break
    }
  }
  return false
}

export {Parse as default, Tokenize}