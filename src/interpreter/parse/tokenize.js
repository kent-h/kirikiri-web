import InterpretCommand from "./interpreter"

// this regex is called repeatedly (using the stickY flag), to extract the next token
// only one of these fragments will actually match, based primarily on the first character
// each fragment matches a different token type
// ;               comment            ^;(.*)$
// *               anchor/save point  ^\*(.+)$
// @               full-line tag      ^@(\S+)(.*)$
// [               inline tag         \[([^\s\]]+)((?:[^"\]\r\n]|"[^"]*"|'[^']')*)\]
// other non-empty text               (?:(?:\r?\n)*(?:[^@;*\[\r\n ]| +[^\[\r\n])[^\[\r\n]*(?:(?:\r?\n)+(?:[^@;*\[\r\n][^\[\r\n]*)?)*)
// whitespace      ignored            (\s+)
// eslint-disable-next-line
const topLevelRegex = /^;(.*)$|^\*(.+)$|^@(\S+)(.*)$|\[([^\s\]]+)((?:[^"\]\r\n]|"[^"]*"|'[^']')*)\]|(?:(?:\r?\n)*(?:[^@;*\[\r\n ]| +[^\[\r\n])[^\[\r\n]*(?:(?:\r?\n)+(?:[^@;*\[\r\n][^\[\r\n]*)?)*)|(\s+)/my

const Tokenize = (tokens, gameState, target) => {
  const stackFrame = gameState.stackFrame

  if (target) {
    const targetRegex = new RegExp("^\\*" + target, "m")
    const match = targetRegex.exec(stackFrame.file)
    stackFrame.fileIndex = match !== null ? match.index : stackFrame.file.length
  }

  topLevelRegex.lastIndex = stackFrame.fileIndex

  let match
  loop:
    while ((match = topLevelRegex.exec(stackFrame.file))) {
      stackFrame.fileIndex = topLevelRegex.lastIndex

      const [text, comment, link, lineTag, lineTagArgs, inlineTag, inlineTagArgs, whitespace] = match
      const type = text[0]

      if (!whitespace) {
        // console.log(text[0], comment || link || lineTag || inlineTag || text)

        switch (type) {
          case ";":
            // comment
            tokens.push({type: ";", text: comment})
            break
          case "*":
            // link
            tokens.push({type: "*", id: link})
            break
          case "@":
          case "[":
            // tag
            const tag = {
              type: type,
              command: lineTag || inlineTag,
              args: ParseTag(text[0], lineTagArgs || inlineTagArgs),
            }
            if (InterpretCommand(tokens, gameState, tag)) {
              break loop
            }
            break
          default:
            // regular text
            if (InterpretCommand(tokens, gameState, {type: "t", text: text})) {
              break loop
            }
        }
      }
      topLevelRegex.lastIndex = stackFrame.fileIndex
    }

  if (!match) {
    if (stackFrame.fileIndex >= stackFrame.file.length) {
      tokens.push({type: "EOF", storage: stackFrame.storage})
    } else {
      const lines = stackFrame.file.substr(0, stackFrame.fileIndex).split("\n")
      const line = lines[lines.length - 1] + stackFrame.file.substr(stackFrame.fileIndex).split("\n")[0]
      const pos = lines[lines.length - 1].length
      const errStr = "failed to parse file " + stackFrame.storage + ", line " + lines.length + ", position " + (pos + 1) + "\n" + line + "\n" + (" ".repeat(pos)) + "^"
      throw new Error(errStr)
    }
  }
}

const argsRegex = /\s*(?:([^\s=]+)=((?:'[^']*'|"[^"]*"|[^\s'"\]])+)|(\*))/y

const ParseTag = (type, argString) => {
  argsRegex.lastIndex = 0

  let args = {}
  let arg
  while ((arg = argsRegex.exec(argString))) {
    if (arg[3]) {
      args["*"] = true
    } else {
      if (arg[2].startsWith("\"")) {
        // can do better un-escaping of quoted strings, this is just a hack for basic (") enclosed strings
        arg[2] = arg[2].substring(1, arg[2].length - 1)
      }
      args[arg[1]] = arg[2]
    }
  }

  return args
}

export default Tokenize
