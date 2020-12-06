import React, {Component} from "react"
import {InView} from "react-intersection-observer"
import {withScrollDetect} from "../../../background/background"

class ScrollDetect extends Component {
  constructor(props) {
    super(props)

    this.state = {visible: false}
  }

  render() {
    return <InView as="div"
                   rootMargin="-50% 0px 100000% 0px"
                   threshold={0.5}
                   skip={Math.abs(this.props.visible.currentID - this.props.id) > 2}
                   onChange={(inView, entry) => {
                     this.props.visible.onChange(this.props.id, "static/game/" + this.props.folder + this.props.image + ".png", !inView, this.props.layers)
                     this.setState({visible: inView})
                   }}>
      <div style={{
        height: "50vh",
        maxHeight: "37.5vw",
        border: this.state.visible ? "1px solid white" : "1px solid green",
      }}/>
    </InView>
  }
}

ScrollDetect = withScrollDetect(ScrollDetect)
export default ScrollDetect