import React, {Component} from "react"
import Layer from "./layer/layer"


class Animation extends Component {
  constructor(props) {
    super(props)

    this.state = {animation: [], animationID: 0}
  }

  componentDidMount() {
    this.prepareAnimation(true)
  }

  componentDidUpdate(prevProps) {
    if (prevProps.animationID !== this.props.animationID) {
      this.abort(false)
      this.prepareAnimation(false)
    }
  }

  async preload(abortPromise) {
    const promises = []
    //preloaded *must* be held to avoid accidentally canceling the load operation
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

    this.setState({animation: this.props.animation, animationID: this.props.animationID})
  }

  render() {
    return <div className="background-margin-hack">
      <div className="background-image-holder">
        {this.state.animationID !== 0 && Object.keys(this.state.animation).map(layerID => {
          const layer = this.state.animation[layerID]
          return <Layer key={layerID}
                        layer={layerID}
                        visibleID={this.state.animationID}
                        animation={layer}/>
        })}
      </div>
    </div>
  }
}

export default Animation