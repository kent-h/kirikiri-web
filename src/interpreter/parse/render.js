import React, {Fragment} from "react"
import ScrollDetect from "../../reader/scroll/detect"
import ScriptLoader from "../script-loader"
import "./render.css"
import {Tag, TagBlock, TagBlockInline} from "./tag/tag"

const Render = (tokens, renderState, onPageReady, debug) => {
  const toDisplay = []
  const appendSection = (Component) => {
    toDisplay.push(<Fragment key={toDisplay.length + 1}>{Component}</Fragment>)
  }

  renderState = renderState === undefined ? {
    bgm: undefined, se: {}, sectionID: 0,
    layers: [], bgmTimeline: [], seTimeline: [],
    buildingSavePoints: [], savePoints: [],
    tokens: [], section: [],
  } : renderState

  const append = (Component) => {
    renderState.section.push(<Fragment key={renderState.section.length + 1}>{Component}</Fragment>)
  }

  const appendText = (text) => {
    if (renderState.ruby) {
      append(
        <span>
          <ruby>
            <rb>{text.slice(0, renderState.ruby.num)}</rb>
            <rt>{renderState.ruby.text}</rt>
          </ruby>
          {text.slice(renderState.ruby.num)}
        </span>)
      renderState.ruby = null
    } else {
      append(<span>{text}</span>)
    }
  }

  tokens.forEach(token => {
    switch (token.type) {
      case ";": // comment
        // console.log(token.text) // ignore comments in general
        break
      case "t": // text
        renderState = RenderChunk(renderState, appendSection, debug)
        appendText(token.text)
        break
      case "*": // link
        renderState.tokens.push(token)
        break
      case "@": // full-line tag
      case "[": // inline tag
        renderState.tokens.push(token)
        const command = token.command.toLowerCase()
        if (command === "ch" || command === "align" || command === "wacky" || command.startsWith("line")) {
          renderState = RenderChunk(renderState, appendSection, debug)
        }
        break
      case "HCF":
        renderState = RenderChunk(renderState, appendSection, debug, true)
        onPageReady()
        break
      case "call": // jump or call statements require more page loading
        toDisplay.push(
          <ScriptLoader key={"s"}
                        renderState={renderState}
                        gameState={token.gameState}
                        storage={token.storage}
                        target={token.target}
                        onPageReady={onPageReady}/>)
        break
      default:
        console.log("warning: unhandled token type: " + token.type, token)
    }
  })
  return toDisplay
}

const lineRegex = /^(line)(\d+)$/

// character sprites placed by position (ld, ldall) get a layer per position
// KAG orders them by index (l 1000, r 2000, lc 3000, rc 4000, c 5000), so the layers go in that order
const POSITION_LAYERS = {l: 10, r: 11, lc: 12, rc: 13, c: 14}
const POSITION_NAMES = {
  l: "l", left: "l",
  lc: "lc", leftcenter: "lc", left_center: "lc",
  c: "c", center: "c",
  rc: "rc", rightcenter: "rc", right_center: "rc",
  r: "r", right: "r",
}
// the layer for a sprite position, center if it has none
const positionLayer = pos => POSITION_LAYERS[POSITION_NAMES[pos] || "c"]

// the superpose macro puts an overlay on the layer KAG calls `.superpose_layer_no` (the last character layer)
// it only needs to be a number above the character layers, so it is drawn on top of them
const SUPERPOSE_LAYER = 20
// texton is a plugin, so its transition time is not in the scripts
const TEXTON_FADE_TIME = 300

// resolves a layer argument, null for "&" expressions other than the superpose layer
const resolveLayer = layer => {
  if (typeof layer !== "string" || !layer.startsWith("&")) {
    return layer
  }
  return layer.includes("superpose_layer_no") ? SUPERPOSE_LAYER : null
}

const RenderChunk = (renderState, appendSection, debug, forceSection) => {
  const tokens = renderState.tokens

  let section = renderState.section

  const verbose = debug === 2

  let sectionID = renderState.sectionID

  let isDivider = false

  let time = 0
  let endTime = 0

  let {layers, bgmTimeline, seTimeline} = renderState

  let {buildingSavePoints, savePoints} = renderState

  let ruby = renderState.ruby

  // superpose and superpose_off only change the back page, so they take effect at the next transition
  let pendingSuperpose = renderState.pendingSuperpose

  // pasttime and turnaround save the background in tmp, black out, then show "&tmp" again
  let savedBackground = renderState.savedBackground

  const generateSection = () => {
    if (isDivider) {
      return
    }
    isDivider = true

    const isNewSavePoint = buildingSavePoints.length !== 0
    savePoints = isNewSavePoint ? buildingSavePoints : savePoints
    buildingSavePoints = []

    if (sectionID !== 0) {
      appendSection(
        <ScrollDetect key={"s" + sectionID}
                      id={sectionID}
                      savePoints={savePoints}
                      isSavePointOwner={isNewSavePoint}
                      timeline={layers}
                      bgmTimeline={bgmTimeline}
                      seTimeline={seTimeline}>
          {section}
        </ScrollDetect>)

      let lastFrames = []
      layers.forEach((animation, layer) => {
        lastFrames[layer] = [Object.assign({}, animation[animation.length - 1], {time: 0})]
      })
      layers = lastFrames
      bgmTimeline = [{time: 0, bgm: renderState.bgm}]
      seTimeline = [{time: 0, sounds: renderState.se}]
      section = []
    }
    sectionID++
  }

  const append = (Component) => {
    section.push(<Fragment key={section.length + 1}>{Component}</Fragment>)
  }

  const lastFrame = (layer) => {
    layer = layer === "base" ? 0 : (layer || 0)
    const animation = layers[layer] || []
    return animation[animation.length - 1]
  }
  // retrieve the layer contents generated by the last animation
  const lastContents = (layer) => {
    layer = layer === "base" ? 0 : (layer || 0)
    return (lastFrame(layer) || {}).contents || {folder: "bgimage/", image: "black"}
  }

  const pushFrame = (layer, frame) => {
    generateSection()
    layer = layer === "base" ? 0 : (layer || 0)
    // a layer is shown from the start of a section, so a new one holds nothing until its first frame
    layers[layer] = layers[layer] || [{contents: {}, time: frame.time}]
    layers[layer].push(frame)
  }

  const duplicateLastFrame = (layer, overrides) => {
    layer = layer === "base" ? 0 : (layer || 0)
    let frame = lastFrame(layer) || {contents: {folder: "bgimage/", image: "black"}, top: 0, left: 0}
    frame = Object.assign({}, frame, {time: time}, overrides || {})
    pushFrame(layer, frame)
  }

  // a frame transitions from the layer's previous frame, however long ago that was
  // holding the layer keeps it as it is until now, so that the next frame transitions from now instead
  const holdLayer = (layer) => {
    const last = lastFrame(layer)
    if (last && last.time < time) {
      duplicateLastFrame(layer)
    }
  }

  // fade out every other layer along with the new background
  const clearOtherLayers = (layer, timeOffset) => {
    layer = layer === "base" ? 0 : (layer || 0)
    timeOffset = parseInt(timeOffset, 10) || 0
    layers.forEach((animation, animLayer) => {
      if (animation !== layers[layer] && lastContents(animLayer).image) {
        holdLayer(animLayer)
        animation.push({contents: {}, time: time + timeOffset})
      }
    })
  }

  const pushBasicFrame = (token, folder, image, layer, timeOffset, fadeInsteadOfAnimate) => {
    const pos = token.args.pos
    // these value can be defined in Config.tjs
    const position = pos === "l" || pos === "left" ? 25 : (pos === "left_center" || pos === "leftcenter" || pos === "lc" ? 37.5 : (pos === "c" || pos === "center" ? 50 : (pos === "right_center" || pos === "rightcenter" || pos === "rc" ? 62.5 : (pos === "right" || pos === "r" ? 75 : 0))))
    pushFrame(layer, {
      time: time + (timeOffset ? parseInt(timeOffset, 10) : 0),
      contents: {
        image: image && image.toLowerCase(),
        folder: folder,
        key: fadeInsteadOfAnimate === !lastContents(layer).key,
        transform: [token.args.fliplr ? "scaleX(-1)" : "", token.args.flipud ? "scaleY(-1)" : "", pos ? "translateX(-50%)" : ""].join(" ") || undefined,
      },
      left: token.args.left ? parseInt(token.args.left, 10) : (pos ? position * 8 : 0),
      top: token.args.top ? parseInt(token.args.top, 10) : (pos ? undefined : 0),
      bottom: pos ? 0 : undefined,
      opacity: (token.args.opacity ? parseInt(token.args.opacity, 10) : 255) / 255,
    })
  }

  // show or hide the superposed image, fading over fadeTime
  const commitSuperpose = (fadeTime) => {
    if (!pendingSuperpose) {
      return
    }
    const pending = pendingSuperpose
    pendingSuperpose = undefined
    fadeTime = fadeTime || 0
    if (pending.hide) {
      if (lastContents(SUPERPOSE_LAYER).image) {
        duplicateLastFrame(SUPERPOSE_LAYER)
        pushFrame(SUPERPOSE_LAYER, {contents: {}, time: time + fadeTime})
      }
    } else {
      // start transparent, then fade in to the requested opacity
      pushBasicFrame(pending.token, "bgimage/", pending.token.args.storage, SUPERPOSE_LAYER, 0, true)
      const frame = lastFrame(SUPERPOSE_LAYER)
      const opacity = frame.opacity
      frame.opacity = 0
      duplicateLastFrame(SUPERPOSE_LAYER, {time: time + fadeTime, opacity})
    }
  }

  const pushBgm = (bgm, fadeTime) => {
    generateSection()
    bgm = bgm && bgm.split(".")[0]
    fadeTime = parseInt(fadeTime || 0, 10)
    const lastBgm = bgmTimeline.length !== 0 ? bgmTimeline[bgmTimeline.length - 1] : []
    if (lastBgm.time !== time) { // if time has advanced, create a new frame
      bgmTimeline.push({time: time, bgm: bgm, fadeTime: fadeTime})
    } else { // else change info of last frame
      lastBgm.bgm = bgm
      lastBgm.fadeTime = fadeTime
    }
  }

  const getLastLoopedSe = () => {
    const prevSe = seTimeline.length !== 0 ? seTimeline[seTimeline.length - 1].sounds || {} : {}
    const sounds = {}
    Object.keys(prevSe).forEach(k => {
      if (prevSe[k].loop) {
        sounds[k] = prevSe[k]
      }
    })
    return sounds
  }

  const pushSound = (sound, fade, loop, stop) => {
    generateSection()
    if (seTimeline.length === 0 || seTimeline[seTimeline.length - 1].time !== time) {
      seTimeline.push({time: time, sounds: getLastLoopedSe()})
    }
    const sounds = seTimeline[seTimeline.length - 1].sounds
    if (sound) {
      sounds[sound.toLowerCase().split(".")[0]] =
        stop ? {fadeOut: parseInt(fade, 10) || 0, stop: true} : {fadeIn: parseInt(fade, 10) || 0, loop: loop === "true"}
    } else if (stop) {
      Object.keys(sounds).forEach(k => {
        if (sounds[k].loop) {
          sounds[k] = {fadeOut: parseInt(fade, 10) || 0, stop: true}
        }
      })
    }
  }

  let specialTokens = {}
  tokens.forEach((token, tokenIndex) => {
    if (token.type === "@" || token.type === "[") {
      let specialTag = "lightyellow"
      switch (token.command.toLowerCase()) {
        case "say":
          pushSound("voice/" + token.args.storage)
          break
        case "playbgm":
        case "fadeinbgm":
          pushBgm(token.args.storage, token.args.time)
          break
        case "stopbgm":
        case "fadeoutbgm":
          pushBgm(undefined, token.args.time)
          break
        case "fadeinse":
        case "playse":
          // TODO: handle looping
          pushSound("sound/" + token.args.storage, token.args.time, token.args.loop)
          break
        case "stopse":
        case "sestop":
        case "fadeoutse":
          const sound = token.args.storage || token.args.file
          pushSound(sound && "sound/" + sound, token.args.time, false, true)
          break
        case "dash":
        case "dashcombo": // these use opacity values where 0 is fully visible
        case "dashcombot": // imag = initial_mag?, mag = scale, fliplr, cx, cy,
          if (token.args.layer && token.args.layer.startsWith("&")) {
            break
          }

          let cx = token.args.cx === "c" ? "400" : token.args.cx || "0"
          let cy = token.args.cy === "c" ? "300" : token.args.cy || "0"

          let fOrigT = "translate(" + (cx ? parseInt(cx, 10) / 8 - 50 + "%" : "50%") + "," + (cy ? parseInt(cy, 10) / 6 - 50 + "%" : "50%") + ")"
          let rOrigT = "translate(" + (cx ? -parseInt(cx, 10) / 8 + 50 + "%" : "50%") + "," + (cy ? -parseInt(cy, 10) / 6 + 50 + "%" : "50%") + ")"

          holdLayer(token.args.layer)
          pushFrame(token.args.layer, {
            time: time,
            contents: {
              image: token.args.storage && token.args.storage.toLowerCase(),
              folder: "bgimage/",
              key: !lastContents(token.args.layer).key,
              transform: [token.args.fliplr ? "scaleX(-1)" : "", token.args.flipud ? "scaleY(-1)" : ""].join(" ") || undefined,
            },
            transform: fOrigT + " scale(" + (token.args.imag ? token.args.imag : 1) + ") " + rOrigT,
            acceleration: token.args.accel || 0,
            left: 0,
            top: 0,
            opacity: 1, // (token.args.opacity ? (255 - parseInt(token.args.opacity, 10)) : 0) / 255,
          })

          time += parseInt(token.args.time, 10) || 0
          duplicateLastFrame(token.args.layer, {
            transform: fOrigT + " scale(" + (token.args.mag ? token.args.mag : 2) + ") " + rOrigT,
          })
          break
        case "imageex": {
          const layer = resolveLayer(token.args.layer)
          if (layer === SUPERPOSE_LAYER) {
            pendingSuperpose = {token}
          } else if (layer !== null) {
            const target = layer || positionLayer(token.args.pos)
            // ld passes its transition time down, so the sprite cross-fades and the script waits for it
            const fadeTime = parseInt(token.args.time, 10) || 0
            holdLayer(target)
            pushBasicFrame(token, "bgimage/", token.args.storage, target, fadeTime, true)
            time += fadeTime
          }
          break
        }
        case "cl_notrans": { // cl and cl_auto pass through this, removing the sprite at a position or all of them
          const pos = token.args.pos || "all"
          const fadeTime = parseInt(token.args.time, 10) || 0
          const targets = pos === "all" ? Object.values(POSITION_LAYERS) : [positionLayer(pos)]
          let cleared = false
          targets.forEach(layer => {
            const last = lastFrame(layer)
            if (last && last.contents.image) {
              holdLayer(layer)
              pushFrame(layer, {contents: {}, time: time + fadeTime})
              cleared = true
            }
          })
          if (cleared) {
            time += fadeTime
          }
          break
        }
        case "layopt":
          if (resolveLayer(token.args.layer) === SUPERPOSE_LAYER && token.args.visible === "false") {
            pendingSuperpose = {hide: true}
          }
          break
        case "redraw": {
          const redrawTime = parseInt(token.args.time, 10) || 0
          commitSuperpose(redrawTime)
          time += redrawTime
          break
        }
        case "texton":
          commitSuperpose(TEXTON_FADE_TIME)
          specialTag = false
          break
        case "image":
        case "image4demo":
          if (token.args.layer && token.args.layer.startsWith("&")) {
            break
          }
          holdLayer(token.args.layer)
          pushBasicFrame(token, "bgimage/", token.args.storage, token.args.layer, 0, true)
          break
        case "eval":
          if (/tmp\s*=\s*f\.layer_image\['base'\]/.test(token.args.exp || "")) {
            savedBackground = lastContents(0).image
          }
          break
        case "fadein":
        case "bg": {
          if (token.args.layer && token.args.layer.startsWith("&")) {
            break
          }
          let file = token.args.file || token.args.storage
          if (file === "&tmp") {
            file = savedBackground || "black"
          }
          duplicateLastFrame(token.args.layer)
          pushBasicFrame(token, "bgimage/", file, token.args.layer, token.args.time, true)
          // noclear keeps the sprites up through the background change
          if (!token.args.noclear || token.args.noclear === "0" || token.args.noclear === "false") {
            clearOtherLayers(token.args.layer, token.args.time)
          }
          // after the clear, so a pending superpose is shown over the new background
          commitSuperpose(parseInt(token.args.time, 10))

          time += (token.args.time ? parseInt(token.args.time, 10) : 0)
          break
        }
        case "move":
          if (token.args.layer && token.args.layer.startsWith("&")) {
            break
          }
          duplicateLastFrame(token.args.layer)

          let nodes = []
          const pathRegex = /\((-?\d+),(-?\d+),(-?\d+)\)/y // read as many as we have
          let node
          while ((node = pathRegex.exec(token.args.path)) !== null) {
            nodes.push(node)
          }

          let moveTime = parseInt(token.args.time, 10) || 0
          nodes.forEach((node, nodeID) => {
            duplicateLastFrame(token.args.layer, {
              time: time + moveTime * (1 + nodeID),
              left: parseInt(node[1], 10),
              top: parseInt(node[2], 10),
              opacity: parseInt(node[3], 10) / 255,
              acceleration: token.args.accel || 0,
            })
          })

          // each path node takes moveTime
          const moveEnd = time + moveTime * nodes.length
          endTime = endTime > moveEnd ? endTime : moveEnd
          break
        case "wm":
          time = time > endTime ? time : endTime
          break
        case "wait":
          time += parseInt(token.args.time, 10) || 0
          break
        default:
          specialTag = false
      }
      if (debug && specialTag) {
        specialTokens[tokenIndex] = specialTag
      }
    }
  })


  let tags = []
  let toRender = []
  tokens.forEach((token, tokenIndex) => {
    let render
    let specialTag = "pink"
    switch (token.type) {
      case "@": // full-line tag
      case "[": // inline tag
        const command = token.command.toLowerCase()
        switch (command) {
          case "r":
            specialTag = false
            if (!isDivider) {
              specialTag = "salmon"
              render = (<br/>)
            }
            break
          case "cm":
            specialTag = false
            if (!isDivider) {
              specialTag = "salmon"
              render = (<><br/><br/><br/></>)
            }
            break
          case "align":
            specialTag = "lightyellow"
            render = <div style={{textAlign: token.args.anchor || "center"}}>{token.args.text}</div>
            break
          case "ruby":
            specialTag = "lightyellow"
            ruby = {text: token.args.text, num: token.args.char || 1}
            break
          case "macro":
            specialTag = false
            // on creation of a macro, there's nothing to render unless debugging
            if (verbose) {
              tags.push(<div style={{color: "darkred", marginLeft: "2em", border: "1px solid green"}}>
                {token.tokens.map((token, index) => (<Tag key={index} command={token}/>))}
              </div>)
            }
            break
          case "return":
            specialTag = false
            // render = <div>--- returning from {token.from} (to {token.to}) ---</div>)
            break
          case "s":
            specialTag = false
            render = ("--- page generation halted at [s] ---")
            break
          case "ch":
            specialTag = "lightyellow"
            render = <span>{String.fromCharCode(parseInt(token.args.text.slice(5, -1), 16))}</span> // formatted like "&($0x00FC)"
            break
          case "wacky":
            specialTag = "lightyellow"
            render = <span>{String.fromCharCode(0xE000 + parseInt(token.args.len, 10) - 1)}</span>
            break
          default:
            const match = lineRegex.exec(command)
            if (match) {
              specialTag = "lightyellow"
              // from trial and error, +2 appears to give the correct line length
              render = <span>{String.fromCharCode(0xE010 + parseInt(match[2], 10) - 1)}</span>
            } else {
              specialTag = false
            }
        }
        break
      case ";": // comment
        specialTag = false
        // console.log(token.text) // ignore comments in general
        break
      case "*": // link
        if (sectionID > 1) {
          buildingSavePoints.push(token.id.split("|")[0])
        }
        break
      default:
        specialTag = false
        console.log("warning: unhandled token type: " + token.type, token)
    }
    if (debug && (specialTag || specialTokens[tokenIndex] || verbose)) {
      tags.push(<Tag command={token} color={specialTag || specialTokens[tokenIndex]}/>)
      if (isDivider) {
        if (render) {
          toRender.push(render)
        }
      } else {
        if (render) {
          append(<TagBlockInline tags={tags}/>)
          tags = []
          append(render)
        }
      }
    } else {
      append(render)
    }
  })


  if (tags.length !== 0) {
    if (isDivider) {
      append(<TagBlock tags={tags}/>)
    } else {
      append(<TagBlockInline tags={tags}/>)
    }
  }

  toRender.forEach(append)

  if (forceSection) {
    generateSection()
  }

  return {
    bgm: bgmTimeline.length !== 0 ? bgmTimeline[bgmTimeline.length - 1].bgm : undefined,
    se: getLastLoopedSe(),
    sectionID: sectionID,
    buildingSavePoints: buildingSavePoints,
    savePoints: savePoints,
    tokens: [],
    section: section,
    layers: layers,
    bgmTimeline: bgmTimeline,
    seTimeline: seTimeline,
    ruby: ruby,
    pendingSuperpose: pendingSuperpose,
    savedBackground: savedBackground,
  }
}

export default Render
