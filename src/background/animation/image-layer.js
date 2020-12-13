import React, {Component} from "react"
import "./image-layer.css"


class ImageLayer extends Component {
  constructor(props) {
    super(props)
    this.sleep = this.sleep.bind(this)

    this.state = {keyframe: this.props.animation[0], last: null}
    this.animate(true)
  }

  componentDidUpdate(prevProps) {
    if (prevProps.visibleID !== this.props.visibleID) {
      this.abort(false)
      this.animate(false)
    }
  }

  componentWillUnmount() {
    this.abort(false)
  }

  sleep(abortPromise, ms) {
    return Promise.race([abortPromise, new Promise(resolve => setTimeout(() => resolve(true), ms))])
  }

  async preload(abortPromise) {
    const promises = []
    //this.preloaded is not used, but must be held to avoid accidentally canceling the load operation
    this.preloaded = this.props.animation.reduce((images, frame) => {
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
    }, {})
    if (promises.length === 0) {
      return false
    }
    return await Promise.race([abortPromise, Promise.all(promises)])
  }

  async animate(componentIsNew) {
    const abortPromise = new Promise(resolve => {
      this.abort = resolve
    })

    if (!await this.preload(abortPromise)) {
      return
    }

    if (!componentIsNew) {
      this.setState({keyframe: this.props.animation[0], last: null})
      // wait for the above setState to propagate & force a redraw before continuing
      if (!await Promise.race([abortPromise, new Promise(resolve => window.requestAnimationFrame(() => resolve(true)))])) {
        return
      }
    }

    let first = true
    let time = 0
    for (const keyframeID in this.props.animation) {
      const keyframe = this.props.animation[keyframeID]
      keyframe.duration = (keyframe.time - time)
      if (first) {
        first = false
      } else {
        this.setState({keyframe: keyframe, last: this.state.keyframe})
      }
      if (!await this.sleep(abortPromise, keyframe.duration < 30 ? 30 : keyframe.duration)) {
        break
      }
      time = keyframe.time
    }
  }

  render() {
    const keyframe = this.state.keyframe
    const last = this.state.last
    const ret = keyframe.contents.image &&
      <img key={(keyframe.contents.key ? "t" : "f") + keyframe.contents.folder + keyframe.contents.image}
           className="background-image-layer"
           layer={this.props.layer}
           src={"static/game/" + keyframe.contents.folder + keyframe.contents.image + ".png"}
           style={{
             transition: keyframe.time !== 0 && ("all " + keyframe.duration + "ms " + (keyframe.acceleration > 0 ? "ease-in" : keyframe.acceleration < 0 ? "ease-out" : "linear")),
             top: (keyframe.top / 6) + "%",
             left: (keyframe.left / 8) + "%",
             transform: (keyframe.transform || "") + " " + keyframe.contents.transform,
             opacity: keyframe.opacity === undefined ? 1 : keyframe.opacity,
           }}
           alt=""/>
    if (!last || !last.contents.image || (keyframe.contents.folder === last.contents.folder && keyframe.contents.image === last.contents.image && (!!keyframe.contents.key === !!last.contents.key))) {
      return [ret]
    } else {
      return [ret,
        <img key={(last.contents.key ? "t" : "f") + last.contents.folder + last.contents.image}
             className="background-image-layer"
             layer={this.props.layer}
             src={"static/game/" + last.contents.folder + last.contents.image + ".png"}
             style={{
               transition: keyframe.time !== 0 && ("all " + keyframe.duration + "ms ease-in"), // keyframe transform will have the correct duration
               top: (last.top / 6) + "%",
               left: (last.left / 8) + "%",
               transform: (last.transform || "") + " " + last.contents.transform,
               opacity: 0,
             }}
             alt=""/>]
    }
  }
}

export default ImageLayer