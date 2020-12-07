import React, {Component} from "react"
import "./image-layer.css"


class ImageLayer extends Component {
  constructor(props) {
    super(props)
    this.sleep = this.sleep.bind(this)

    this.state = {keyframe: this.props.animation[0], last: null}
    this.animate()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.visibleID !== this.props.visibleID) {
      this.abort(false)
      this.setState({keyframe: this.props.animation[0], last: null})
      this.animate()
    }
  }

  componentWillUnmount() {
    this.abort(false)
  }

  sleep(ms) {
    return Promise.race([this.abortable, new Promise(resolve => setTimeout(() => resolve(true), ms))])
  }

  async animate() {
    this.abortable = new Promise(resolve => {
      this.abort = resolve
    })

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
      if (!await this.sleep(keyframe.duration < 30 ? 30 : keyframe.duration)) {
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
             transition: "all " + keyframe.duration + "ms " + (keyframe.acceleration > 0 ? "ease-in" : keyframe.acceleration < 0 ? "ease-out" : "linear"),
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
               transition: "all " + keyframe.duration + "ms ease-in", // keyframe transform will have the correct duration
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