import {BGM} from "./generated/asset-dictionary"
import {SharedScripts} from "./generated/asset-dictionary.js"

const sharedScriptsMap = SharedScripts.reduce((map, item) => {
  map[item] = true
  return map
}, {})

export const LocateScript = (name, lang) => {
  name = name.toLowerCase().split(".", 1)[0]
  if (sharedScriptsMap[name]) {
    return "/static/scripts/" + name + ".ks.gz"
  }
  return "/static/scripts/" + lang + "/" + name + ".ks.gz"
}

export const LocateBGM = (name, version) => {
  let shortV = version === "vita" ? "v" : version === "ps2" ? "p" : version === "original" ? "o" : "c" // classic
  const possible = BGM[name] || ""
  if (!possible.includes(shortV)) {
    shortV = possible.charAt(-1) // if requested version is not available, return any valid version
  }
  const longV = shortV === "v" ? "vita" : shortV === "p" ? "ps2" : shortV === "o" ? "original" : "classic"
  return "/static/bgm/" + longV + "/" + name + ".ogg"
}
