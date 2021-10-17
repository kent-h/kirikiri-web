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

export const RouteToNum = route => {
  return {
    "saber": 0,
    "セイバ": 0,
    "rin": 1,
    "凛": 1,
    "sakura": 2,
    "桜": 2,
  }[route] || 0
}

export const NumToRoute = (route, lang) => {
  return {
    "eng": {
      0: "saber",
      1: "rin",
      2: "sakura",
    },
    "jp": {
      0: "セイバ",
      1: "凛",
      2: "桜",
    },
  }[lang][route] || (lang === "eng" ? "saber" : "セイバ")
}

export const PathToID = (params) => {
  let r = {
    "prologue": "プ",
    "プロローグ": "プ",
    "saber": "セ",
    "セイバ": "セ",
    "rin": "凛",
    "凛": "凛",
    "sakura": "桜",
    "桜": "桜",
  }[params.route]
  const match = /^(\d+)\D*$/.exec(params.day)
  if (match) {
    r += match[1]
  }
  return r + "-" + params.chapter
}

export const IDToPath = (id, lang) => {
  const match = /^(.)(\d*)-(\d*)/.exec(id)
  if (match) {
    const route = {
      "eng": {
        "プ": "prologue",
        "セ": "saber",
        "凛": "rin",
        "桜": "sakura",
      },
      "jp": {
        "プ": "プロローグ",
        "セ": "セイバ",
        "凛": "凛",
        "桜": "桜",
      },
    }[lang][match[1]]
    return route + "/" + (match[2] ? match[2] + (lang === "eng" ? ({
      "1": "st",
      "2": "nd",
      "3": "rd",
    }[match[2]] || "th") + "-day/" : "日目/") : "") + match[3]
  }
}
