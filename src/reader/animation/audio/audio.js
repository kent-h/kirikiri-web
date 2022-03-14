import React, {Component} from "react"
import ReactAudioPlayer from "react-audio-player"
import {LocateBGM} from "../../../resources/lookup"
import {withOptions} from "../../debug"

class Audio extends Component {
  constructor(props) {
    super(props)
    this.sleep = this.sleep.bind(this)
    this.fadeIn = this.fadeIn.bind(this)
    this.fadeOut = this.fadeOut.bind(this)

    this.abortPromise = new Promise(resolve => {
      this.abort = resolve
    })

    this.state = {fadeIn: 0, fadeOut: 1}
  }

  componentDidMount() {
    if (this.props.bgm || this.props.sound) {
      this.fadeIn(this.abortPromise, this.props.fadeIn)
    }
  }

  componentDidUpdate(prevProps) {
    const startFadeOut = !prevProps.fadeOut && this.props.fadeOut
    const startPlay = !prevProps.bgm && !prevProps.sound && (this.props.bgm || this.props.sound)
    const released = (prevProps.bgm || prevProps.sound) && !this.props.bgm && !this.props.sound

    if (startFadeOut) {
      this.fadeOut(this.abortPromise, this.props.fadeOut)
    } else if (startPlay) {
      this.fadeIn(this.abortPromise, this.props.fadeIn)
    } else if (released) {
      this.abort()
      this.abortPromise = new Promise(resolve => {
        this.abort = resolve
      })
    }

    if (this.props.bgm && this.props.options.bgmVersion !== prevProps.options.bgmVersion) {
      this.forceUpdate() // force re-render when the BGM version changes
    }
  }

  componentWillUnmount() {
    this.abort()
  }

  sleep(abortPromise, ms) {
    return Promise.race([abortPromise, new Promise(resolve => setTimeout(() => resolve(true), ms))])
  }

  async fadeIn(abortPromise, fadeTime) {
    this.setState({fadeOut: 1})

    if (!fadeTime || fadeTime === 0) {
      this.setState({fadeIn: 1})
      return
    }

    for (let i = 0; i <= fadeTime; i += 5) {
      // turn volume up every 1/100th of a second
      this.setState({fadeIn: i / fadeTime})
      if (!await this.sleep(abortPromise, 5)) {
        break
      }
    }
  }

  async fadeOut(abortPromise, fadeTime) {
    if (!fadeTime || fadeTime === 0) {
      this.setState({fadeOut: 0})
    } else {

      for (let i = 0; i <= fadeTime; i += 5) {
        this.setState({fadeOut: 1 - i / fadeTime})
        // turn volume down every 1/100th of a second
        if (!await this.sleep(abortPromise, 5)) {
          break
        }
      }
    }

    this.props.onFadeOutComplete(this.props.id)
  }

  render() {
    const src = this.props.bgm ? LocateBGM(this.props.bgm, this.props.options.bgmVersion) : this.props.sound ? "/static/" + this.props.sound : undefined

    const volume = this.props.bgm ? this.props.options.bgm : this.props.sound ? (this.props.sound.startsWith("voice/") ? this.props.options.voice : this.props.options.sound) : 0

    // iOS appears to reset the audio player, while other platforms do not; easy workaround for non-iOS devices is to recreate the player
    const isIOS = ["iPad Simulator", "iPhone Simulator", "iPod Simulator", "iPad", "iPhone", "iPod"].includes(navigator.platform)
    return <ReactAudioPlayer key={isIOS ? undefined : (this.props.bgm || this.props.sound)}
                             autoPlay
                             muted={volume === 0}
                             volume={0.5 * volume * this.state.fadeIn * this.state.fadeOut}
                             loop={this.props.loop}
                             onCanPlayThrough={e => e.target.play()}
                             preload={(this.props.bgm || this.props.sound) ? "auto" : "none"}>
      {src && <>
        <source src={src + ".ogg"} type="audio/ogg"/>
        <source src={src + ".m4a"} type="audio/mp4"/>
      </>}
    </ReactAudioPlayer>
  }
}

Audio = withOptions(Audio)
export default Audio
