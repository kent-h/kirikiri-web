import {SharedScripts} from "./asset-dictionary.js"

const sharedScriptsMap = SharedScripts.reduce((map, item) => {
  map[item] = true
  return map
}, {})

export const LocateScript = (name) => {
  name = name.toLowerCase()
  if (sharedScriptsMap[name.split(".", 1)]) {
    return "/static/scripts/" + name + ".gz"
  }
  return "/static/scripts/eng/" + name + ".gz"
}
