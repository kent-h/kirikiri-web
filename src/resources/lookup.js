import {
  BGM,
  EngImages,
  HImages,
  HImagesBellandy,
  HImagesBishopcruz,
  HImagesDefaultArtist,
  HImagesOriginal,
  HScripts,
  MatureImages,
} from "./generated/asset-dictionary"
import {SharedScripts} from "./generated/asset-dictionary.js"

const sharedScriptsMap = SharedScripts.reduce((map, item) => {
  map[item] = true
  return map
}, {})
const hScriptsMap = HScripts.reduce((map, item) => {
  map[item] = true
  return map
}, {})

export const LocateScript = (name, lang) => {
  name = name.toLowerCase().split(".", 1)[0]
  if (sharedScriptsMap[name]) {
    return "/static/scripts/" + name + ".ks.gz"
  }
  return "/static/scripts/" + lang + (hScriptsMap[name] ? "/h/" : "/") + name + ".ks.gz"
}

export const LocateBGM = (name, version) => {
  let shortV = version === "vita" ? "v" : version === "ps2" ? "p" : version === "classic" ? "c" : "o" // original
  const possible = BGM[name]
  if (!possible) {
    return
  }
  while (!possible.includes(shortV)) { // if requested version is not available
    if (shortV === "o") { // if desired was original
      shortV = possible.charAt(0) // return any valid version
    }
    shortV = shortV === "v" ? "p" : "o" // return next-preferred valid version v->p->o & c->o
  }
  const longV = shortV === "v" ? "vita" : shortV === "p" ? "ps2" : shortV === "c" ? "classic" : "original"
  return "/static/bgm/" + longV + "/" + name
}

const engImagesMap = EngImages.reduce((map, item) => {
  map[item] = true
  return map
}, {})
const matureImagesMap = MatureImages.reduce((map, item) => {
  map[item] = true
  return map
}, {})
const hImagesMap = HImages.reduce((map, item) => {
  map[item] = true
  return map
}, {})
const hImagesArtistsMap = {
  "1": HImagesBishopcruz.reduce((map, item) => {
    map[item] = true
    return map
  }, {}),
  "2": HImagesBellandy.reduce((map, item) => {
    map[item] = true
    return map
  }, {}),
  "3": HImagesOriginal.reduce((map, item) => {
    map[item] = true
    return map
  }, {}),
}

export const LocateImage = (name, lang, mature, h, hArtist) => {
  if (lang === "eng" && engImagesMap[name]) {
    return "/static/images/eng/" + name + ".webp"
  }
  if (mature && matureImagesMap[name]) {
    return "/static/images/mature/" + name + ".webp"
  }
  if (h) {
    if (h === 2) {
      for (let cut=0; !hArtist && cut<name.length; cut++){
        hArtist = HImagesDefaultArtist[name.slice(0, name.length-cut)]
      }
      if ((hImagesArtistsMap[hArtist] || {})[name]) {
        return "/static/images/h/" + {
          "1": "bishopcruz",
          "2": "bellandy",
          "3": "original",
        }[hArtist] + "/" + name + ".webp"
      }
    }
    if (hImagesMap[name]) {
      return "/static/images/h/" + name + ".webp"
    }
  }
  return "/static/images/" + name + ".webp"
}

export const RouteToNum = route => {
  return {
    "fate": 0,
    "saber": 0,
    "セイバ": 0,
    "ubw": 1,
    "rin": 1,
    "凛": 1,
    "hf": 2,
    "sakura": 2,
    "桜": 2,
  }[route] || 0
}

export const NumToRoute = (route) => {
  return {
    0: "fate",
    1: "ubw",
    2: "hf",
  }[route] || "fate"
}

export const PathToID = (params) => {
  let r = {
    "prologue": "プ",
    "プロローグ": "プ",
    "fate": "セ",
    "saber": "セ",
    "セイバ": "セ",
    "ubw": "凛",
    "rin": "凛",
    "凛": "凛",
    "hf": "桜",
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
        "セ": "fate",
        "凛": "ubw",
        "桜": "hf",
      },
      "jp": {
        "プ": "プロローグ",
        "セ": "fate",
        "凛": "ubw",
        "桜": "hf",
      },
    }[lang][match[1]]
    return route + "/" + (match[2] ? match[2] + (lang === "eng" ? ({
      "1": "st",
      "2": "nd",
      "3": "rd",
    }[match[2]] || "th") + "-day/" : "日目/") : "") + match[3]
  }
}
