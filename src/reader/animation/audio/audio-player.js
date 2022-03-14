import React, {Component} from "react"
import Audio from "./audio"

class AudioPlayer extends Component {
  constructor(props) {
    super(props)
    this.sleep = this.sleep.bind(this)
    this.onFadeOutComplete = this.onFadeOutComplete.bind(this)

    this.state = {playingSe: [], fadingOut: [], soundIDPool: [...Array(8).keys()].map(i => i + 1)}
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
          const ret = {
            playingBgm: keyframe.bgm ? Object.assign({id: state.soundIDPool[0], loop: true}, keyframe) : undefined,
            soundIDPool: [...state.soundIDPool].slice(1),
          }
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
        let soundIDPool = [...state.soundIDPool]
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
              playingSe.push({id: soundIDPool[0], sound: sound, loop: info.loop, fadeIn: info.fadeIn})
              soundIDPool = soundIDPool.slice(1)
            }
          }
        })
        return {playingSe: playingSe, fadingOut: state.fadingOut.concat(stopping), soundIDPool}
      })
      time = keyframe.time
    }
  }

  onFadeOutComplete(playingID) {
    this.setState(state => ({
      fadingOut: state.fadingOut.filter(sound => (sound.id !== playingID)),
      soundIDPool: state.soundIDPool.concat([playingID]),
    }))
  }

  render() {
    const unusedIDs = [...Array(8).keys()].reduce((m, k) => {
      m[k + 1] = true
      return m
    }, {})
    const sounds = this.state.fadingOut.map((sound) => {
      delete unusedIDs[sound.id]
      return <Audio key={sound.id}
                    id={sound.id}
                    bgm={sound.bgm}
                    sound={sound.sound}
                    loop={sound.loop}
                    fadeIn={sound.fadeIn}
                    fadeOut={sound.fadeOut}
                    onFadeOutComplete={this.onFadeOutComplete}/>
    }).concat(this.state.playingSe.map((sound) => {
      delete unusedIDs[sound.id]
      return <Audio key={sound.id}
                    id={sound.id}
                    sound={sound.sound}
                    loop={sound.loop}
                    fadeIn={sound.fadeIn}/>
    }))
    if (this.state.playingBgm) {
      delete unusedIDs[this.state.playingBgm.id]
      sounds.push(<Audio key={this.state.playingBgm.id}
                         id={this.state.playingBgm.id}
                         bgm={this.state.playingBgm.bgm}
                         loop={this.state.playingBgm.loop}
                         fadeIn={this.state.playingBgm.fadeTime}/>)
    }

    // ensure that all audio devices exist at all times
    Object.keys(unusedIDs).forEach(id => sounds.push(<Audio key={id} id={id}/>))

    return <div>
      {sounds}
    </div>
  }
}

export default AudioPlayer
