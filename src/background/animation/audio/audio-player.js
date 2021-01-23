import React, {Component} from "react"
import ReactAudioPlayer from "react-audio-player"

class AudioPlayer extends Component {
  constructor(props) {
    super(props)
    this.sleep = this.sleep.bind(this)

    this.state = {playingSe: [], fadeIn: 0, fadeOut: 0}
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
      this.setState(state => ({playingBgm: undefined, lastPlayingBgm: state.playingBgm}))
      this.fadeBGM(abortPromise, 500) // 0.5s fade time if none is defined
    }

    let time = 0
    for (const keyframeID in this.props.bgmTimeline) {
      const keyframe = this.props.bgmTimeline[keyframeID]
      const duration = (keyframe.time - time)
      if (!await this.sleep(abortPromise, duration)) {
        break
      }
      this.setState(state => ((!state.playingBgm || state.playingBgm.bgm !== keyframe.bgm) ? {
        playingBgm: keyframe,
        lastPlayingBgm: state.playingBgm,
      } : {}))
      this.fadeBGM(abortPromise, keyframe.fadeTime)
      time = keyframe.time
    }
  }

  async fadeBGM(abortPromise, fadeTime) {
    if (fadeTime === 0) {
      this.setState({fadeIn: 1, fadeOut: 0})
      return
    }

    for (let i = 0; i <= fadeTime; i += 10) {
      this.setState({fadeIn: i / fadeTime, fadeOut: 1 - i / fadeTime})
      // turn volume down every 1/100th of a second
      if (!await this.sleep(abortPromise, 10)) {
        break
      }
    }
    this.setState({lastPlayingBgm: undefined})
  }

  async runSeTimeline(abortPromise) {
    // clear playing sound effects
    this.setState({playingSe: []})
    if (!await Promise.race([abortPromise, new Promise(resolve => window.requestAnimationFrame(() => resolve(true)))])) {
      return
    }

    let first = true
    let time = 0
    for (const keyframeID in this.props.seTimeline) {
      const keyframe = this.props.seTimeline[keyframeID]
      const duration = (keyframe.time - time)
      if (!await this.sleep(abortPromise, duration)) {
        break
      }
      if (first) {
        first = false
        this.setState({playingSe: Object.keys(keyframe.sounds)})
      } else {
        this.setState(state => ({playingSe: state.playingSe.concat(Object.keys(keyframe.sounds))}))
      }
      time = keyframe.time
    }
  }

  render() {
    const bgmVersion = "vita" // vita | ps2 | classic

    const bgmPlayer = (bgm, fade) => (
      <ReactAudioPlayer autoPlay key={bgm}
                        volume={0.5 * fade} preload="auto"
                        src={"/static/bgm/" + bgmVersion + "/" + bgm + ".ogg"}/>
    )

    return <>
      {[
        this.state.playingBgm && this.state.playingBgm.bgm &&
        bgmPlayer(this.state.playingBgm.bgm, this.state.fadeIn),
        this.state.lastPlayingBgm && this.state.lastPlayingBgm.bgm && (!this.state.playingBgm || this.state.lastPlayingBgm.bgm !== this.state.playingBgm.bgm) &&
        bgmPlayer(this.state.lastPlayingBgm.bgm, this.state.fadeOut),
      ]}

      {this.state.playingSe.map((sound, index) => (
        <ReactAudioPlayer autoPlay key={this.props.animationID + "" + index}
                          volume={0.4} preload="auto"
                          src={"/static/" + sound + ".ogg"}/>
      ))}
    </>
  }
}

export default AudioPlayer