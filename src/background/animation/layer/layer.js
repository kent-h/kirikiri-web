import React, {Component} from "react"
import "./layer.css"


class Layer extends Component {
  constructor(props) {
    super(props)
    this.sleep = this.sleep.bind(this)

    this.state = {keyframe: null, last: null}
  }

  componentDidMount() {
    this.animate()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.animationID !== this.props.animationID) {
      this.abort(false)
      this.animate()
    }
  }

  componentWillUnmount() {
    this.abort(false)
  }

  sleep(abortPromise, ms) {
    return Promise.race([abortPromise, new Promise(resolve => setTimeout(() => resolve(true), ms))])
  }

  async animate() {
    const abortPromise = new Promise(resolve => {
      this.abort = resolve
    })

    this.props.animation[0].duration = 0
    this.setState({keyframe: this.props.animation[0], last: null})
    // wait for the above setState to propagate & force a redraw before continuing
    if (!await Promise.race([abortPromise, new Promise(resolve => window.requestAnimationFrame(() => resolve(true)))])) {
      return
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
    const ret = keyframe && keyframe.contents.image &&
      <img key={(keyframe.contents.key ? "t" : "f") + keyframe.contents.folder + keyframe.contents.image + this.props.animationID}
           className="background-image-layer"
           layer={this.props.layer}
           src={"static/game/" + keyframe.contents.folder + keyframe.contents.image + ".png"}
           style={{
             transition: "all " + keyframe.duration + "ms " + (keyframe.acceleration > 0 ? "ease-in" : keyframe.acceleration < 0 ? "ease-out" : "linear"),
             top: (keyframe.top / 6) + "%",
             left: (keyframe.left / 8) + "%",
             width: keyframe.contents.naturalWidth ? keyframe.contents.naturalWidth + "%" : "100%",
             transform: (keyframe.transform || "") + " " + keyframe.contents.transform,
             opacity: keyframe.opacity === undefined ? 1 : keyframe.opacity,
           }}
           alt=""/>
    if (!last || !last.contents.image || (keyframe.contents.folder === last.contents.folder && keyframe.contents.image === last.contents.image && (!!keyframe.contents.key === !!last.contents.key))) {
      return [ret]
    } else {
      return [ret,
        <img key={(last.contents.key ? "t" : "f") + last.contents.folder + last.contents.image + this.props.animationID}
             className="background-image-layer"
             layer={this.props.layer}
             src={"static/game/" + last.contents.folder + last.contents.image + ".png"}
             style={{
               // keyframe transform will have the correct duration
               transition: "all " + keyframe.duration + "ms " + (keyframe.acceleration > 0 ? "ease-in" : keyframe.acceleration < 0 ? "ease-out" : "linear"),
               top: (last.top / 6) + "%",
               left: (last.left / 8) + "%",
               width: last.contents.naturalWidth ? last.contents.naturalWidth + "%" : "100%",
               transform: (last.transform || "") + " " + last.contents.transform,
               opacity: 0,
             }}
             alt=""/>]
    }
  }
}

export default Layer