import React, {Component} from "react"
import "./image-layer.css"


class ImageLayer extends Component {
  constructor(props) {
    super(props)
    this.sleep = this.sleep.bind(this)

    this.state = {keyframe: this.props.animation[0]}
    this.animate()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.visibleID !== this.props.visibleID) {
      this.abort(false)
      this.setState({keyframe: this.props.animation[0]})
      this.animate()
    }
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
      keyframe.duration = keyframe.time - time
      if (first) {
        first = false
      } else {
        this.setState({keyframe: keyframe})
      }
      if (!await this.sleep(keyframe.duration)) {
        break
      }
      time = keyframe.time
    }
  }

  render() {
    const keyframe = this.state.keyframe
    const last = keyframe.contents.last
    const ret = keyframe.contents.image &&
      <img key={keyframe.contents.folder + keyframe.contents.image}
           className="background-image-layer"
           layer={this.props.layer}
           src={"static/game/" + keyframe.contents.folder + keyframe.contents.image + ".png"}
           style={{
             transition: "all " + keyframe.duration + "ms ease",
             top: (keyframe.top / 6) + "%",
             left: (keyframe.left / 8) + "%",
             transform: keyframe.contents.transform,
             opacity: keyframe.opacity === undefined ? 1 : keyframe.opacity,
           }}
           alt=""/>
    if (!last || !last.image || (keyframe.contents.folder === last.folder && keyframe.contents.image === last.image)) {
      return [ret]
    } else {
      return [ret,
        <img key={last.folder + last.image}
             className="background-image-layer"
             layer={this.props.layer}
             src={"static/game/" + last.folder + last.image + ".png"}
             style={{
               transition: "all " + keyframe.duration + "ms ease",
               top: (keyframe.top / 6) + "%",
               left: (keyframe.left / 8) + "%",
               transform: last.transform,
               opacity: 0,
             }}
             alt=""/>]
    }
  }
}

export default ImageLayer