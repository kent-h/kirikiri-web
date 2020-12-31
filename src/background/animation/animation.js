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
    // preloaded *must* be held to avoid accidentally canceling the load operation
    this.preloaded = Object.keys(this.props.animation || []).reduce((images, layerID) => (
      this.props.animation[layerID].reduce((images, frame) => {
        if (frame.contents.image) {
          const name = frame.contents.folder + frame.contents.image
          if (!images[name]) {
            const img = new Image()
            promises.push(new Promise(resolve => {
              img.onload = () => resolve(true)
              img.onerror = () => resolve(false)
            }))
            img.src = "static/game/" + name + ".png"
            images[name] = img
          }
        }
        return images
      }, images)), {})

    const loadSound = (file) => {
      const audio = new Audio()
      promises.push(new Promise(resolve => {
        audio.oncanplaythrough = () => resolve(true)
        audio.onerror = () => resolve(false)
      }))
      audio.src = file
      return audio
    }

    // wait for music to load
    // neededBgm *must* be held to avoid accidentally canceling the load operation
    this.neededBgm = (this.props.bgmTimeline || []).reduce((sounds, keyframe) => {
      if (keyframe.bgm && !sounds[keyframe.bgm]) {
        sounds[keyframe.bgm] = loadSound("/static/game/bgm/" + keyframe.bgm + ".ogg")
      }
      return sounds
    }, {})

    // wait for sound effects to load
    // neededSe *must* be held to avoid accidentally canceling the load operation
    this.neededSe = (this.props.seTimeline || []).reduce((sounds, keyframe) => (
      Object.keys(keyframe.sounds).reduce((sounds, sound) => {
        if (!sounds[sound]) {
          sounds[sound] = loadSound("/static/game/sound/" + sound + ".wav")
        }
        return sounds
      }, sounds)
    ), {})

    return await Promise.race([abortPromise, Promise.all(promises)])
  }

  async prepareAnimation() {
    const abortPromise = new Promise(resolve => {
      this.abort = resolve
    })

    if (!await this.preload(abortPromise)) {
      return
    }

    // save resolution of each image
    Object.keys(this.props.animation || []).forEach(layerID => {
      const layer = this.props.animation[layerID]
      layer.forEach(frame => {
        if (frame.contents.image) {
          frame.contents.naturalWidth = this.preloaded[frame.contents.folder + frame.contents.image].naturalWidth / 8
        }
      })
    })

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