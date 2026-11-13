// Renders every scene of the real game scripts and checks the result against what the scripts ask for.
// It needs the scripts on disk, so it only runs when KS_DIR is set:
//   node scripts/fetch-scripts.js /tmp/ks
//   KS_DIR=/tmp/ks CI=true npx react-scripts test --watchAll=false corpus
import fs from "fs"
import path from "path"
import {scripts} from "../../resources/generated/scene-index"
import {LocateScript} from "../../resources/lookup"
import Render from "./render"
import Tokenize from "./tokenize"

const dir = process.env.KS_DIR
const corpus = dir ? describe : describe.skip
const timeout = 15 * 60 * 1000

const read = storage => fs.readFileSync(path.join(dir, LocateScript(storage, "eng").replace(/^\/static\/scripts\//, "").replace(/\.gz$/, "")), "utf8")

// collects the scroll sections and the nested script loads from rendered output
const collect = (element, out) => {
  if (!element || typeof element !== "object") {
    return
  }
  if (Array.isArray(element)) {
    element.forEach(e => collect(e, out))
    return
  }
  const props = element.props || {}
  if (props.timeline) {
    out.sections.push(props)
  }
  if (props.gameState && props.renderState) {
    out.calls.push(props)
  }
  collect(props.children, out)
}

// renders a scene the way ScriptLoader does, following [call]s into other scripts
const renderScene = name => {
  const tokens = []
  const out = {sections: [], calls: []}
  const run = (gameState, target, renderState) => {
    const added = []
    Tokenize(added, gameState, target)
    tokens.push(...added)
    collect(Render(added, renderState, () => {}, 0), out)
  }
  const file = read(name)
  run({macros: {}, stackFrame: {storage: "マクロ", file: read("マクロ"), fileIndex: 0, returnFrame: {storage: name, file, fileIndex: 0}}})
  while (out.calls.length) {
    const call = out.calls.shift()
    const frame = call.gameState.stackFrame
    frame.storage = call.storage
    frame.file = read(call.storage)
    frame.fileIndex = 0
    run(call.gameState, call.target, call.renderState)
  }
  return {tokens, sections: out.sections}
}

const isTag = token => token.type === "@" || token.type === "["

// the pictures a script command asks to show
const POSITIONS = ["l", "left", "r", "right", "c", "center", "lc", "leftcenter", "rc", "rightcenter"]
const shownBy = token => {
  const args = token.args || {}
  const list = value => (value || "").split(",")
  switch (token.command.toLowerCase()) {
    case "ld":
    case "ld_auto":
    case "ld_notrans":
      return [args.file]
    case "fg":
      return list(args.storage || args.file)
    case "chgfg":
      return list(args.storage)
    case "ldall":
    case "ldallt":
      return POSITIONS.map(pos => args[pos])
    case "rep":
      return list(args.storages).concat(["l", "r", "c", "lc", "rc"].map(pos => args[pos]))
    default:
      return []
  }
}

const imagesIn = sections => {
  const images = new Set()
  sections.forEach(section => section.timeline.forEach(frames => frames && frames.forEach(frame => {
    if (frame.contents && frame.contents.image) {
      images.add(frame.contents.image)
    }
  })))
  return images
}

// pictures a script names that the renderer is known not to show, each with the reason
const missingAllowed = {}

const sceneNames = [...new Set(Object.values(scripts))]

corpus("the real scripts", () => {
  const rendered = {}
  beforeAll(() => {
    sceneNames.forEach(name => {
      rendered[name] = renderScene(name)
    })
  }, timeout)

  test("every picture a script shows reaches a layer", () => {
    const missing = []
    sceneNames.forEach(name => {
      const {tokens, sections} = rendered[name]
      const images = imagesIn(sections)
      tokens.filter(token => isTag(token) && !token.depth).forEach(token => {
        shownBy(token).filter(image => image && !image.startsWith("&")).forEach(image => {
          if (!images.has(image.toLowerCase()) && !(missingAllowed[name] || []).includes(image)) {
            missing.push(token.command + " " + image + " in " + name)
          }
        })
      })
    })
    expect(missing.length + " missing: " + missing.slice(0, 20).join(" | ")).toBe("0 missing: ")
  })

  test("character layers stay off the background", () => {
    const wrong = []
    sceneNames.forEach(name => {
      const {tokens, sections} = rendered[name]
      // numbered layers are character layers, the renderer keeps those apart from the background (0)
      sections.forEach(section => section.timeline.forEach((frames, layer) => {
        if (frames && layer >= 1 && layer <= 9 && frames.some(frame => frame.contents && frame.contents.image)) {
          wrong.push("layer " + layer + " used in " + name)
        }
      }))
      const onCharacterLayer = new Set(tokens
        .filter(token => isTag(token) && /^(image|imageex)$/i.test(token.command) && /^\d$/.test(token.args.layer || ""))
        .map(token => (token.args.storage || "").toLowerCase()))
      const background = new Set(tokens
        .filter(token => isTag(token) && /^(bg|fadein|dash|dashcombo|dashcombot|image|image4demo|imageex)$/i.test(token.command) && !/^\d$/.test(token.args.layer || ""))
        .map(token => (token.args.file || token.args.storage || "").toLowerCase()))
      sections.forEach(section => (section.timeline[0] || []).forEach(frame => {
        const image = frame.contents && frame.contents.image
        if (image && onCharacterLayer.has(image) && !background.has(image)) {
          wrong.push(image + " on the background in " + name)
        }
      }))
    })
    expect(wrong.length + " wrong: " + [...new Set(wrong)].slice(0, 20).join(" | ")).toBe("0 wrong: ")
  })

  test("a scene that ends in a blackout ends on black", () => {
    const wrong = []
    sceneNames.forEach(name => {
      const {tokens, sections} = rendered[name]
      let lastText = -1
      tokens.forEach((token, i) => token.type === "t" && (lastText = i))
      const after = tokens.slice(lastText + 1).filter(token => isTag(token) && !token.depth && /^(blackout|black|bg|fadein)$/i.test(token.command))
      const last = after[after.length - 1]
      if (!last || !/^(blackout|black)$/i.test(last.command)) {
        return
      }
      const base = sections.length ? sections[sections.length - 1].timeline[0] || [] : []
      const image = base.length ? base[base.length - 1].contents.image : undefined
      if (image !== "black") {
        wrong.push(name + " ends on " + image)
      }
    })
    expect(wrong.length + " wrong: " + wrong.slice(0, 20).join(" | ")).toBe("0 wrong: ")
  })
})
