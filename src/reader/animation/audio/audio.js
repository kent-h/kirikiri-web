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
    this.fadeIn(this.abortPromise, this.props.fadeIn)
  }

  componentDidUpdate(prevProps) {
    if (this.props.fadeOut !== undefined && prevProps.fadeOut !== this.props.fadeOut) {
      this.fadeOut(this.abortPromise, this.props.fadeOut)
    }
  }

  componentWillUnmount() {
    this.abort()
  }

  sleep(abortPromise, ms) {
    return Promise.race([abortPromise, new Promise(resolve => setTimeout(() => resolve(true), ms))])
  }

  async fadeIn(abortPromise, fadeTime) {
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
    const src = this.props.bgm ? LocateBGM(this.props.bgm, this.props.options.bgmVersion) : "/static/" + this.props.sound + ".ogg"

    let volume = this.props.bgm ? this.props.options.bgm :
      (this.props.sound.startsWith("voice/") ? this.props.options.voice : this.props.options.sound)

    return <ReactAudioPlayer autoPlay
                             volume={0.5 * volume * this.state.fadeIn * this.state.fadeOut}
                             loop={this.props.loop}
                             preload="auto"
                             src={src}/>
  }
}

Audio = withOptions(Audio)
export default Audio
