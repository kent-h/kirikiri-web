import React, {Component} from "react"
import ReactAudioPlayer from "react-audio-player"

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
    const bgmVersion = "vita" // vita | ps2 | classic

    const src = (this.props.bgm ? (
      "/static/bgm/" + bgmVersion + "/" + this.props.bgm
    ) : (
      "/static/" + this.props.sound
    )) + ".ogg"

    return <ReactAudioPlayer autoPlay
                             volume={0.5 * this.state.fadeIn * this.state.fadeOut}
                             preload="auto"
                             src={src}/>
  }
}

export default Audio
