import React, {Component} from "react"
import {InView} from "react-intersection-observer"
import {withScrollDetect} from "../../../background/background"

class ScrollDetect extends Component {
  constructor(props) {
    super(props)

    this.state = {visible: false}
  }

  render() {
    // the <InView/> listener lags if there are too many enabled at one time
    // to fix this, only enable listeners that are close to the currently scrolled-to part of the page
    // we do this by only enabling multiples-of-2^n listeners, which are <= 2^n listeners away from the current one
    let makeActive = false
    for (let mul = 1; mul <= Math.max(this.props.id, this.props.visible.currentID); mul *= 4) {
      if (this.props.id % mul === 0) {
        if (Math.abs(this.props.visible.currentID - this.props.id) <= mul) {
          makeActive = true
          break
        }
      }
    }

    return <InView rootMargin="10000000% 0px -100% 0px"
                   threshold={0}
                   skip={!makeActive}
                   onChange={(inView, entry) => {
                     this.props.visible.onChange(this.props.id, inView, this.props.animation, this.props.bgmTimeline, this.props.seTimeline)
                     this.setState({visible: inView})
                   }}>
      <div style={{
        height: this.props.id === 1 ? "55vh" : "67vh",
        // maxHeight: "37.5vw",
        // border: this.state.visible ? "1px solid green" : "1px solid red",
      }}/>
    </InView>
  }
}

ScrollDetect = withScrollDetect(ScrollDetect)
export default ScrollDetect