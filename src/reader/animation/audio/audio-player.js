import React, {Component} from "react"
import Audio from "./audio"

class AudioPlayer extends Component {
  constructor(props) {
    super(props)
    this.sleep = this.sleep.bind(this)
    this.onFadeOutComplete = this.onFadeOutComplete.bind(this)

    this.soundID = 1
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

  getPlayingID() {
    return this.soundID++
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
      const id = this.getPlayingID()
      this.setState(state => {
        if ((!state.playingBgm && keyframe.bgm) || (state.playingBgm && state.playingBgm.bgm !== keyframe.bgm)) {
          // move playing bgm to the fadingOut list for 0.5s
          const ret = {playingBgm: keyframe.bgm ? Object.assign({id: id}, keyframe) : undefined}
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
      const ret = {playingSe: []}
      if (state.playingSe.length !== 0) {
        // move playing sounds to the fadingOut list for 0.5s
        state.playingSe.forEach(se => {
          se.fadeOut = 400
        })
        ret.fadingOut = state.fadingOut.concat(state.playingSe)
      }
      return ret
    })

    if (!await Promise.race([abortPromise, new Promise(resolve => window.requestAnimationFrame(() => resolve(true)))])) {
      return
    }

    let time = 0
    for (const keyframeID in this.props.seTimeline) {
      const keyframe = this.props.seTimeline[keyframeID]
      const duration = (keyframe.time - time)
      if (!await this.sleep(abortPromise, duration)) {
        break
      }

      this.setState(state => ({
        playingSe: state.playingSe.concat(
          Object.keys(keyframe.sounds).map(sound => (
            Object.assign({id: this.getPlayingID(), sound: sound})
          ))),
      }))
      time = keyframe.time
    }
  }

  onFadeOutComplete(playingID) {
    this.setState(state => ({fadingOut: state.fadingOut.filter(sound => (sound.id !== playingID))}))
  }

  render() {
    const sounds = this.state.fadingOut.map((sound) => (
      <Audio key={sound.id}
             id={sound.id}
             bgm={sound.bgm}
             sound={sound.sound}
             fadeOut={sound.fadeOut}
             onFadeOutComplete={this.onFadeOutComplete}/>
    )).concat(this.state.playingSe.map((sound) => (
      <Audio key={sound.id}
             id={sound.id}
             sound={sound.sound}/>
    )))
    if (this.state.playingBgm) {
      sounds.push(<Audio key={this.state.playingBgm.id}
                         id={this.state.playingBgm.id}
                         bgm={this.state.playingBgm.bgm}
                         fadeIn={this.state.playingBgm.fadeTime}/>)
    }

    return <>
      {sounds}
    </>
  }
}

export default AudioPlayer
