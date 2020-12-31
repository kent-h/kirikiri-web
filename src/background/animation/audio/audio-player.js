import React, {Component} from "react"
import ReactAudioPlayer from "react-audio-player"

class AudioPlayer extends Component {
  constructor(props) {
    super(props)
    this.sleep = this.sleep.bind(this)

    this.state = {playingSe: []}
  }

  componentDidMount() {
    const abortPromise = new Promise(resolve => {
      this.abort = resolve
    })
    this.runBgmTimeline(abortPromise)
    this.runSeTimeline(abortPromise)
  }

  componentDidUpdate(prevProps) {
    if (prevProps.animationID !== this.props.animationID) {
      this.abort(false)
      const abortPromise = new Promise(resolve => {
        this.abort = resolve
      })
      this.runBgmTimeline(abortPromise)
      this.runSeTimeline(abortPromise)
    }
  }

  componentWillUnmount() {
    this.abort(false)
  }

  sleep(abortPromise, ms) {
    return Promise.race([abortPromise, new Promise(resolve => setTimeout(() => resolve(true), ms))])
  }

  async runBgmTimeline(abortPromise) {
    let time = 0
    for (const keyframeID in this.props.bgmTimeline) {
      const keyframe = this.props.bgmTimeline[keyframeID]
      const duration = (keyframe.time - time)
      if (!await this.sleep(abortPromise, duration)) {
        break
      }
      this.setState(state => ({playingBgm: keyframe, lastPlayingBgm: state.playingBgm}))
      time = keyframe.time
    }
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
    return <>
      {[this.state.playingBgm && this.state.playingBgm.bgm &&
      <ReactAudioPlayer autoPlay key={this.state.playingBgm.bgm}
                        volume={0.5} preload="auto"
                        src={"/static/game/bgm/" + this.state.playingBgm.bgm + ".ogg"}/>,
        this.state.lastPlayingBgm && this.state.lastPlayingBgm.bgm && this.state.lastPlayingBgm.bgm !== this.state.playingBgm.bgm &&
        <ReactAudioPlayer autoPlay key={this.state.lastPlayingBgm.bgm}
                          volume={0.5} preload="auto"
                          src={"/static/game/bgm/" + this.state.lastPlayingBgm.bgm + ".ogg"}/>]}

      {this.state.playingSe.map((sound, index) => (
        <ReactAudioPlayer autoPlay key={this.props.animationID + "" + index}
                          volume={0.4} preload="auto"
                          src={"/static/game/sound/" + sound + ".wav"}/>
      ))}
    </>
  }
}

export default AudioPlayer