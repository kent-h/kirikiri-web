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
  let shortV = version === "vita" ? "v" : version === "ps2" ? "p" : version === "classic" ? "c" : "o" // original
  const possible = BGM[name] || ""
  while (!possible.includes(shortV)) { // if requested version is not available
    if (shortV === "o") { // if desired was original
      shortV = possible.charAt(0) // return any valid version
    }
    shortV = shortV === "v" ? "p" : "o" // return next-preferred valid version v->p->o & c->o
  }
  const longV = shortV === "v" ? "vita" : shortV === "p" ? "ps2" : shortV === "c" ? "classic" : "original"
  return "/static/bgm/" + longV + "/" + name + ".ogg"
}
