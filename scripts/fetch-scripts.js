#!/usr/bin/env node
// fetch-scripts.js downloads the English game scripts from the live site, for the corpus test
// (src/interpreter/parse/corpus.test.js). Files keep the layout of /static/scripts/, without the .gz:
// shared scripts at the top, scenes under eng/ and eng/h/. Files already downloaded are kept.
//
// usage: node scripts/fetch-scripts.js <folder>
// then:  KS_DIR=<folder> CI=true npx react-scripts test --watchAll=false corpus

const fs = require("fs")
const https = require("https")
const path = require("path")
const zlib = require("zlib")

const dir = process.argv[2]
if (!dir) {
  console.error("usage: node scripts/fetch-scripts.js <folder>")
  process.exit(1)
}
const upstream = "https://fatestaynight.vnovel.org/static/scripts/"
const generated = path.join(__dirname, "..", "src", "resources", "generated")

// the generated indexes are ES modules, so read the few lists needed with a regex instead of importing them
const readList = (file, name) => {
  const source = fs.readFileSync(path.join(generated, file), "utf8")
  const body = new RegExp("export const " + name + " = [\\[{]([^\\]}]*)").exec(source)[1]
  return (body.match(/"[^"]*"/g) || []).map(s => s.slice(1, -1))
}
const shared = new Set(readList("asset-dictionary.js", "SharedScripts"))
const hScripts = new Set(readList("asset-dictionary.js", "HScripts"))
// the scripts index is "id": "name" pairs, keep the names
const scenes = readList("scene-index.js", "scripts").filter((_, i) => i % 2 === 1)

// same rule as LocateScript in src/resources/lookup.js, for lang "eng"
const locate = storage => {
  const name = storage.toLowerCase().split(".", 1)[0]
  return shared.has(name) ? name + ".ks" : "eng/" + (hScripts.has(name) ? "h/" : "") + name + ".ks"
}

const get = (url, tries = 3) => new Promise((resolve, reject) => {
  https.get(url, {headers: {"accept-encoding": "gzip"}}, res => {
    const chunks = []
    res.on("data", c => chunks.push(c))
    res.on("end", () => {
      if (res.statusCode !== 200) {
        return reject(new Error(res.statusCode + " " + url))
      }
      const body = Buffer.concat(chunks)
      // served with Content-Encoding: gzip, but accept a raw .gz body too
      resolve(body[0] === 0x1f && body[1] === 0x8b ? zlib.gunzipSync(body) : body)
    })
  }).on("error", e => tries > 1 ? get(url, tries - 1).then(resolve, reject) : reject(e))
})

const queue = ["マクロ.ks", "変数初期化.ks"].concat(scenes.map(locate))
const seen = new Set(queue)
let failed = 0

const fetchOne = async rel => {
  const file = path.join(dir, rel)
  if (!fs.existsSync(file)) {
    const body = await get(upstream + encodeURI(rel) + ".gz")
    fs.mkdirSync(path.dirname(file), {recursive: true})
    fs.writeFileSync(file, body)
  }
  // scenes call other scripts (the epilogues), fetch those too
  const text = fs.readFileSync(file, "utf8")
  for (const match of text.matchAll(/[@[]call\s[^\]\r\n]*?storage=([^\s\]]+)/g)) {
    const next = locate(match[1])
    if (!seen.has(next)) {
      seen.add(next)
      queue.push(next)
    }
  }
}

const worker = async () => {
  while (queue.length) {
    const rel = queue.shift()
    try {
      await fetchOne(rel)
    } catch (e) {
      failed++
      console.warn("failed: " + rel + ": " + e.message)
    }
  }
}

Promise.all(Array.from({length: 8}, worker)).then(() => {
  console.log((seen.size - failed) + " scripts in " + path.resolve(dir) + (failed ? ", " + failed + " failed" : ""))
  process.exit(failed ? 1 : 0)
})
