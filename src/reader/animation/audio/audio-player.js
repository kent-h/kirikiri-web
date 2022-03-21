import React, {Component} from "react"
import {withOptions} from "../../debug"
import Audio from "./audio"
import "./audio-player.css"

const isIOS = ["iPad Simulator", "iPhone Simulator", "iPod Simulator", "iPad", "iPhone", "iPod"].includes(navigator.platform)

const getSoundIDPool = (state) => {
  const inUse = {}
  if (state.playingBgm) {
    inUse[state.playingBgm.id] = true
  }
  state.playingSe.forEach(sound => {
    inUse[sound.id] = true
  })
  state.fadingOut.forEach(sound => {
    inUse[sound.id] = true
  })
  let id = 1
  return {
    next: () => {
      while (inUse[id]) {
        id++
      }
      return id++
    },
  }
}

class AudioPlayer extends Component {
  constructor(props) {
    super(props)
    this.sleep = this.sleep.bind(this)
    this.releaseSound = this.releaseSound.bind(this)

    this.state = {playingSe: [], fadingOut: []}
  }

  componentDidMount() {
    const abortPromise = new Promise(resolve => {
      this.abort = resolve
    })
    this.runBGMTimeline(abortPromise)
    this.runSeTimeline(abortPromise)
  }

  componentDidUpdate(prevProps) {
    if (prevProps.animationID !== this.props.animationID) {
      this.abort(false)
      const abortPromise = new Promise(resolve => {
        this.abort = resolve
      })
      this.runBGMTimeline(abortPromise)
      this.runSeTimeline(abortPromise)
    }
  }

  componentWillUnmount() {
    this.abort(false)
  }

  sleep(abortPromise, ms) {
    return Promise.race([abortPromise, new Promise(resolve => setTimeout(() => resolve(true), ms))])
  }

  async runBGMTimeline(abortPromise) {
    if (this.props.bgmTimeline.length === 0) {
      this.setState(state => {
        const ret = {playingBgm: undefined}
        if (state.playingBgm !== undefined) {
          // move playing bgm to the fadingOut list for 0.5s
          state.playingBgm.fadeOut = 500
          ret.fadingOut = state.fadingOut.concat([state.playingBgm])
        }
        return ret
      })
    }

    let time = 0
    for (const keyframeID in this.props.bgmTimeline) {
      const keyframe = this.props.bgmTimeline[keyframeID]
      const duration = (keyframe.time - time)
      if (!await this.sleep(abortPromise, duration)) {
        break
      }
      this.setState(state => {
        if ((!state.playingBgm && keyframe.bgm) || (state.playingBgm && state.playingBgm.bgm !== keyframe.bgm)) {
          // move playing bgm to the fadingOut list for 0.5s
          const id = getSoundIDPool(state).next()
          const ret = {playingBgm: keyframe.bgm ? Object.assign({id: id, loop: true}, keyframe) : undefined}
          if (state.playingBgm) {
            state.playingBgm.fadeOut = keyframe.fadeTime || 500
            ret.fadingOut = state.fadingOut.concat([state.playingBgm])
          }
          return ret
        }
        return {}
      })
      time = keyframe.time
    }
  }

  async runSeTimeline(abortPromise) {
    // clear playing sound effects
    this.setState(state => {
      const initialSounds = (this.props.seTimeline[0] || {}).sounds || {}
      const playingSe = []
      const fadingOut = []
      state.playingSe.forEach(se => {
        if ((initialSounds[se.sound] || {}).loop) { // keep only looping sounds which are expected at the start of this timeline
          playingSe.push(se)
        } else {
          // move sound to the fadingOut list for 0.4s
          se.fadeOut = 400
          fadingOut.push(se)
        }
      })
      return {playingSe, fadingOut: state.fadingOut.concat(fadingOut)}
    })

    let time = 0
    for (const keyframeID in this.props.seTimeline) {
      const keyframe = this.props.seTimeline[keyframeID]
      const duration = (keyframe.time - time)
      if (!await this.sleep(abortPromise, duration)) {
        break
      }

      this.setState(state => {
        let soundIDPool = getSoundIDPool(state)
        // figure out which sounds to stop
        const stopping = []
        const playingSe = state.playingSe.filter(se => {
          const info = keyframe.sounds[se.sound] || {}
          if (info.stop) {
            se.fadeOut = info.fadeOut
            stopping.push(se)
            return false
          }
          return true
        })

        // figure out which sounds to start
        Object.keys(keyframe.sounds).forEach(sound => {
          const info = keyframe.sounds[sound]
          if (!info.stop) {
            if (!info.loop || !playingSe.some(se => (se.sound === sound && se.loop))) { // don't add if looped sound is already playing
              playingSe.push({id: soundIDPool.next(), sound: sound, loop: info.loop, fadeIn: info.fadeIn})
            }
          }
        })
        return {playingSe: playingSe, fadingOut: state.fadingOut.concat(stopping)}
      })
      time = keyframe.time
    }
  }

  releaseSound(playingID) {
    playingID = parseInt(playingID, 10)
    this.setState(state => ({
      playingBgm: state.playingBgm && state.playingBgm.id !== playingID ? state.playingBgm : undefined,
      playingSe: state.playingSe.filter(sound => (sound.id !== playingID)),
      fadingOut: state.fadingOut.filter(sound => (sound.id !== playingID)),
    }))
  }

  render() {
    const sounds = {}
    this.state.fadingOut.forEach(sound => {
      sounds[sound.id] =
        <Audio key={sound.id}
               id={sound.id}
               bgm={sound.bgm}
               sound={sound.sound}
               loop={sound.loop}
               fadeIn={sound.fadeIn}
               fadeOut={sound.fadeOut}
               onEnded={this.releaseSound}/>
    })
    this.state.playingSe.forEach(sound => {
      sounds[sound.id] =
        <Audio key={sound.id}
               id={sound.id}
               sound={sound.sound}
               loop={sound.loop}
               fadeIn={sound.fadeIn}
               onEnded={this.releaseSound}/>
    })
    if (this.state.playingBgm) {
      sounds[this.state.playingBgm.id] =
        <Audio key={this.state.playingBgm.id}
               id={this.state.playingBgm.id}
               bgm={this.state.playingBgm.bgm}
               loop={this.state.playingBgm.loop}
               fadeIn={this.state.playingBgm.fadeTime}
               onEnded={this.releaseSound}/>
    }

    // ensure that all audio devices exist at all times
    return <div className="audio-player" debug={this.props.options.debugLevel ? "" : undefined}>
      {(isIOS ? [...Array(12).keys()].map(k => k + 1) : Object.keys(sounds)).map(id => (
        sounds[id] || <Audio key={id} id={id} onEnded={this.releaseSound}/>
      ))}
    </div>
  }
}

AudioPlayer = withOptions(AudioPlayer)
export default AudioPlayer
