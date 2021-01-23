import React, {Component} from "react"
import AudioPlayer from "./audio/audio-player"
import Layer from "./layer/layer"


class Animation extends Component {
  constructor(props) {
    super(props)

    this.state = {animation: [], animationID: 0, bgmTimeline: [], seTimeline: []}
  }

  componentDidMount() {
    this.prepareAnimation()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.animationID !== this.props.animationID) {
      this.abort(false)
      this.prepareAnimation()
    }
  }

  async preload(abortPromise) {
    const promises = []
    // neededImg *must* be held to avoid accidentally canceling the load operation
    let neededImg = Object.keys(this.props.animation || []).reduce((images, layerID) => (
      this.props.animation[layerID].reduce((images, frame) => {
        if (frame.contents.image) {
          const name = frame.contents.image
          if (!images[name]) {
            const img = new Image()
            promises.push(new Promise(resolve => {
              img.onload = () => resolve(true)
              img.onerror = () => resolve(false)
            }))
            img.src = "/static/images/" + name + ".webp"
            images[name] = img
          }
        }
        return images
      }, images)), {})

    const loadSound = (file) => {
      const audio = new Audio()
      audio.preload = "auto"
      promises.push(new Promise(resolve => {
        audio.oncanplaythrough = () => resolve(true)
        audio.onerror = () => resolve(false)
      }))
      audio.src = file
      return audio
    }

    const bgmVersion = "vita"

    // wait for music to load
    // neededBgm *must* be held to avoid accidentally canceling the load operation
    let neededBgm = (this.props.bgmTimeline || []).reduce((sounds, keyframe) => {
      if (keyframe.bgm && !sounds[keyframe.bgm]) {
        sounds[keyframe.bgm] = loadSound("/static/bgm/" + bgmVersion + "/" + keyframe.bgm + ".ogg")
      }
      return sounds
    }, {})

    // wait for sound effects to load
    // neededSe *must* be held to avoid accidentally canceling the load operation
    let neededSe = (this.props.seTimeline || []).reduce((sounds, keyframe) => (
      Object.keys(keyframe.sounds).reduce((sounds, sound) => {
        if (!sounds[sound]) {
          sounds[sound] = loadSound("/static/" + sound + ".ogg")
        }
        return sounds
      }, sounds)
    ), {})

    const continueRet = await Promise.race([abortPromise, Promise.all(promises)])
    if (!continueRet) {
      Object.keys(neededImg).forEach(key => {
        neededImg[key].src = ""
        delete neededImg[key]
      })
      neededImg = undefined
      Object.keys(neededBgm).forEach(key => {
        neededBgm[key].src = ""
        delete neededBgm[key]
      })
      neededBgm = undefined
      Object.keys(neededSe).forEach(key => {
        neededSe[key].src = ""
        delete neededSe[key]
      })
      neededSe = undefined
    } else {
      // save resolution of each image
      Object.keys(this.props.animation || []).forEach(layerID => {
        const layer = this.props.animation[layerID]
        layer.forEach(frame => {
          if (frame.contents.image) {
            frame.contents.naturalWidth = neededImg[frame.contents.image].naturalWidth / 8
          }
        })
      })
    }
    return continueRet
  }

  async prepareAnimation() {
    const abortPromise = new Promise(resolve => {
      this.abort = resolve
    })

    if (!await this.preload(abortPromise)) {
      return
    }


    this.setState({
      animationID: this.props.animationID,
      animation: this.props.animation,
      bgmTimeline: this.props.bgmTimeline,
      seTimeline: this.props.seTimeline,
    })
  }

  render() {
    const positions = ["large-background-holder-left background-blur", "large-background-holder-right background-blur", "large-background-holder-bottom background-blur", "background-holder"]

    return <>
      {positions.map(position => (
        <div key={position} className={position}>
          <div className="background-margin-hack">
            <div className="background-image-holder">
              {this.state.animationID !== 0 && Object.keys(this.state.animation).map(layerID => {
                const layer = this.state.animation[layerID]
                return <Layer key={layerID}
                              layer={layerID}
                              animationID={this.state.animationID}
                              animation={layer}/>
              })}
            </div>
          </div>
        </div>
      ))}
      <AudioPlayer animationID={this.state.animationID}
                   bgmTimeline={this.state.bgmTimeline || []}
                   seTimeline={this.state.seTimeline || []}/>
    </>
  }
}

export default Animation