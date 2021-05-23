import {SharedScripts} from "./asset-dictionary.js"

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
