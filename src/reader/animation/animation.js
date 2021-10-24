import React, {Component} from "react"
import {LocateBGM} from "../../resources/lookup"
import {withOptions} from "../debug"
import {withScroll} from "../scroll/watcher"
import "./animation.css"
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
    if (prevProps.animation.id !== this.props.animation.id) {
      this.abort(false)
      this.prepareAnimation()
    }
  }

  async preload(abortPromise) {
    const promises = []
    // wait for images to load
    // neededImg *must* be held to avoid accidentally canceling the load operation
    let neededImg = Object.keys(this.props.animation.timeline || []).reduce((images, layerID) => (
      this.props.animation.timeline[layerID].reduce((images, frame) => {
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
      audio.innerHTML =
        "<source src=\"" + file + ".ogg\" type=\"audio/ogg\"/>" +
        "<source src=\"" + file + ".aac\" type=\"audio/aac\"/>"
      return audio
    }

    // wait for music to load
    // neededBgm *must* be held to avoid accidentally canceling the load operation
    let neededBgm = (this.props.animation.bgmTimeline || []).reduce((sounds, keyframe) => {
      if (keyframe.bgm && !sounds[keyframe.bgm]) {
        sounds[keyframe.bgm] = loadSound(LocateBGM(keyframe.bgm, this.props.options.bgmVersion))
      }
      return sounds
    }, {})

    // wait for sound effects to load
    // neededSe *must* be held to avoid accidentally canceling the load operation
    let neededSe = (this.props.animation.seTimeline || []).reduce((sounds, keyframe) => (
      Object.keys(keyframe.sounds).reduce((sounds, sound) => {
        if (!sounds[sound]) {
          sounds[sound] = loadSound("/static/" + sound)
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
      Object.keys(this.props.animation.timeline || []).forEach(layerID => {
        const layer = this.props.animation.timeline[layerID]
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
      animationID: this.props.animation.id,
      animation: this.props.animation.timeline,
      bgmTimeline: this.props.animation.bgmTimeline,
      seTimeline: this.props.animation.seTimeline,
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
                return <Layer key={this.props.freezeFrame + layerID}
                              layer={layerID}
                              animationID={this.state.animationID}
                              animation={this.props.freezeFrame && layer.length !== 0 ? [layer[0]] : layer}/>
              })}
            </div>
          </div>
        </div>
      ))}
      {!this.props.freezeFrame &&
      <AudioPlayer animationID={this.state.animationID}
                   bgmTimeline={this.state.bgmTimeline || []}
                   seTimeline={this.state.seTimeline || []}/>}
    </>
  }
}

Animation = withOptions(withScroll(Animation))
export default Animation
