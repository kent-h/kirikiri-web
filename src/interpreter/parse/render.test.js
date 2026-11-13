import Render from "./render"
import Tokenize from "./tokenize"

// the superpose macros as defined in the game's マクロ.ks
const macros = `
@macro name=superpose
@textoff
@imageex * layer=&.superpose_layer_no page=back visible=true opacity=%opacity|255
@eval exp="f.superpose_on=true"
@endmacro

@macro name=superpose_off
@if exp="f.superpose_on"
@textoff
@layopt layer=&(.superpose_layer_no) page=back visible=false
@endif
@endmacro

@macro name=ld_notrans
@eval cond="mp.pos==''" exp="mp.pos='center'"
@imageEx * storage=%file page=back visible=true
@endmacro

@macro name=ld_auto
@ld_notrans *
@transex *
@wt canskip=%canskip|false
@endmacro

@macro name=ld
@textoff cond="sf.notextonoff==0&&f.notextonoff==0"
@ld_auto *
@texton cond="sf.notextonoff==0&&f.notextonoff==0"
@endmacro

@macro name=cl_auto
@cl_notrans *
@transex *
@wt canskip=%canskip|false
@endmacro

@macro name=cl
@cl_auto *
@endmacro

@macro name=ldallT
@backlay
@cl_notrans pos=all cond="mp.erase!='false'"
@ld_notrans file="&(mp.l!=void?mp.l:mp.left)" pos=l cond="mp.l!=void||mp.left!=void" index=%il|1000
@ld_notrans file="&(mp.r!=void?mp.r:mp.right)" pos=r cond="mp.r!=void||mp.right!=void" index=%ir|2000
@ld_notrans file="&(mp.c!=void?mp.c:mp.center)" pos=c cond="mp.c!=void||mp.center!=void" index=%ic|5000
@transex *
@endmacro

@macro name=ldall
@ldallT *
@endmacro

@macro name=turnaround
@textoff
@eval exp="global.tmp=f.layer_image['base']"
@blackout time=700 rule=シャッター下から vague=128
@wait time=700
@bg cond="mp.texton!='false'" file="&tmp" time=700 rule=シャッター下から vague=128
@fadein cond="mp.texton=='false'" file="&tmp" time=700 rule=シャッター下から vague=128
@endmacro

@macro name=blackout
@fadein * file=black
@endmacro
@return
`

// returns the animation timeline of each scroll section, in order
const sections = script => {
  const tokens = []
  Tokenize(tokens, {
    macros: {},
    stackFrame: {storage: "macros", file: macros, fileIndex: 0, returnFrame: {storage: "test", file: script, fileIndex: 0}},
  })
  return Render(tokens, undefined, () => {}, 0)
    .map(fragment => fragment.props.children)
    .filter(child => child && child.props && child.props.timeline)
    .map(child => child.props.timeline)
}

// the layers that hold an image at the end of a section
const shownAtEnd = timeline => timeline
  .map(frames => frames[frames.length - 1].contents.image)
  .filter(image => image)

// the prologue day 1 pendant scene, shortened
const pendantScene = `
@fadein file=room time=1000
@superpose storage=pendant opacity=168
@texton
Finishing breakfast, I grab my bag.
@say storage=v1
Oh yeah. I should bring the pendant.
@pg
@say storage=v2
This thing is a hundred years old after all.
@textoff
@redraw method=crossfade vague=64 time=600
@superpose_off
@texton
No, that's an understatement.
@say storage=v3
I put the pendant into my pocket.
`

test("a superposed image stays up until superpose_off", () => {
  const timelines = sections(pendantScene)
  expect(timelines.map(shownAtEnd)).toEqual([
    ["room", "pendant"],
    ["room", "pendant"],
    ["room", "pendant"],
    ["room"],
    ["room"],
  ])
})

test("a superposed image appears after the background transition, at its opacity", () => {
  const frames = sections(pendantScene)[0].find(frames => frames && frames.some(frame => frame.contents.image === "pendant"))
  // nothing visible before the background has faded in
  frames.filter(frame => frame.time < 1000).forEach(frame => {
    expect(!frame.contents.image || frame.opacity === 0).toBe(true)
  })
  expect(frames[frames.length - 1].opacity).toBeCloseTo(168 / 255)
})

test("superpose_off fades the image out after the redraw", () => {
  const frames = sections(pendantScene)[3].find(frames => frames && frames.some(frame => frame.contents.image === "pendant"))
  const last = frames[frames.length - 1]
  const beforeLast = frames[frames.length - 2]
  expect(last.contents.image).toBeUndefined()
  expect(beforeLast.contents.image).toBe("pendant")
  expect(beforeLast.time).toBe(600) // still fully shown when the redraw has finished
  expect(last.time).toBeGreaterThan(beforeLast.time) // then fades out rather than vanishing
})

test("a background change clears a superposed image", () => {
  const timelines = sections(`
@fadein file=room time=1000
@superpose storage=pendant opacity=168
@texton
One.
@fadein file=street time=1000
Two.
@say storage=v1
Three.
`)
  expect(timelines.map(shownAtEnd)).toEqual([
    ["room", "pendant"],
    ["street"],
    ["street"],
  ])
})

// the frames of one layer in one section, as [image, time] pairs
const framesOf = (timeline, layer) => timeline[layer].map(frame => [frame.contents.image, frame.time])

test("a background change fades sprites out with it, not from the start of the section", () => {
  const timelines = sections(`
@fadein file=room time=500
@image storage=sprite layer=1 left=0 top=0
One.
@wait time=1000
@fadein file=street time=500
Two.
`)
  expect(framesOf(timelines[1], 1)).toEqual([
    ["sprite", 0],
    ["sprite", 1000], // still shown when the background starts changing
    [undefined, 1500], // gone when it has finished
  ])
})

test("swapping a sprite after a wait swaps it then, not from the start of the section", () => {
  const timelines = sections(`
@fadein file=room time=500
@image storage=a layer=1 left=0 top=0
One.
@wait time=2000
@image storage=b layer=1 left=0 top=0
Two.
`)
  expect(framesOf(timelines[1], 1)).toEqual([
    ["a", 0],
    ["a", 2000],
    ["b", 2000],
  ])
})

test("a dash on a layer starts when the dash does", () => {
  const timelines = sections(`
@fadein file=room time=500
One.
@wait time=1000
@dashcombot storage=flash cx=c cy=c imag=1 mag=2 time=200
Two.
`)
  const frames = framesOf(timelines[1], 0)
  expect(frames.slice(0, 3)).toEqual([["room", 0], ["room", 1000], ["flash", 1000]])
})

test("a layer that first appears partway through a section shows nothing until then", () => {
  const timelines = sections(`
@fadein file=room time=500
One.
@wait time=1000
@image storage=sprite layer=3 left=0 top=0
Two.
`)
  expect(framesOf(timelines[1], 3)).toEqual([
    [undefined, 1000],
    ["sprite", 1000],
  ])
})

test("wm waits for every node of a move path", () => {
  const timelines = sections(`
@fadein file=room time=500
@image storage=sprite layer=1 left=0 top=0
One.
@wait time=100
@move layer=1 path=(10,0,255)(20,0,255) time=300
@wm
@image storage=other layer=1 left=0 top=0
Two.
`)
  const frames = framesOf(timelines[1], 1)
  // the path ends at 100 + 2 * 300, and the next image comes after that
  expect(frames[frames.length - 2]).toEqual(["sprite", 700])
  expect(frames[frames.length - 1]).toEqual(["other", 700])
})


// the images a section shows at its end, by layer
const imagesAtEnd = timeline => timeline.reduce((images, frames, layer) => {
  const image = frames && frames[frames.length - 1].contents.image
  if (image) {
    images[layer] = image
  }
  return images
}, {})

test("a background change with noclear keeps the sprites", () => {
  const timelines = sections(`
@fadein file=hall time=500
One.
@ld_notrans file=teacher pos=c index=5000
@fadein file=stairs time=800 noclear=1
Oh, Tohsaka-san.
@say storage=v1
Good morning.
`)
  expect(Object.values(imagesAtEnd(timelines[1]))).toEqual(["stairs", "teacher"])
  expect(Object.values(imagesAtEnd(timelines[2]))).toEqual(["stairs", "teacher"])
})

test("ld cross-fades the sprite over its time, and cl fades it out", () => {
  const timelines = sections(`
@fadein file=stairs time=500
@ld_notrans file=a pos=c
One.
@ld pos=c file=b time=300 method=crossfade
Two.
@cl pos=c time=400
Three.
`)
  const layer = timelines[1].findIndex(frames => frames && frames.some(frame => frame.contents.image === "b"))
  expect(framesOf(timelines[1], layer)).toEqual([["a", 0], ["b", 300]])
  expect(framesOf(timelines[2], layer)).toEqual([["b", 0], [undefined, 400]])
})

test("ldall shows the sprites it names, at their positions", () => {
  const timelines = sections(`
@fadein file=stairs time=500
@ld_notrans file=a pos=c
One.
@ldall l=left_sprite c=center_sprite time=400
Two.
`)
  const images = Object.values(imagesAtEnd(timelines[1]))
  expect(images).toEqual(["stairs", "left_sprite", "center_sprite"])
})

test("turnaround blacks out and brings the same background back", () => {
  const timelines = sections(`
@fadein file=classroom time=500
One.
@turnaround
Two.
`)
  expect(framesOf(timelines[1], 0)).toEqual([
    ["classroom", 0],
    ["classroom", 0],
    ["black", 700],
    ["black", 1400],
    ["classroom", 2100],
  ])
})
