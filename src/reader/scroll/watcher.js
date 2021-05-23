import React, {Component} from "react"
import {withRouter} from "react-router"
import {withOptions} from "../debug"
import "../reader.css"

const {Provider: AnimationProvider, Consumer: AnimationConsumer} = React.createContext({id: 0})
const {Provider: ScrollProvider, Consumer: ScrollConsumer} = React.createContext({id: 0})

class ScrollWatcher extends Component {
  lastScrollSection
  lastScrollTime

  constructor(props) {
    super(props)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.addAnchor = this.addAnchor.bind(this)
    this.onSectionVisibilityChange = this.onSectionVisibilityChange.bind(this)

    this.savePointAtLoadTime = props.location.hash
    this.linkRefs = {}

    this.lastJumpTime = new Date()
    // to avoid unnecessary re-rendering, we will recreate the value for the provider only when the scrolled section changes
    this.includeCallbacks = {
      onSectionChange: this.onSectionVisibilityChange,
      addAnchor: this.addAnchor,
    }
    this.visible = {}
    const visible = Object.assign({id: 0}, this.includeCallbacks)
    this.state = {visible: visible, nextVisible: visible}
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevState.visible.id !== this.state.visible.id) {
      const section = this.linkRefs[this.state.visible.id + 1]
      const newURL = this.props.location.pathname + this.props.location.search + (section && section.savePoints.length !== 0 ? ("#" + section.savePoints[0]) : "")
      this.props.history.replace(newURL)
    }
  }

  componentDidMount() {
    document.addEventListener("keydown", this.onKeyDown)
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.onKeyDown)
  }

  onKeyDown(e) {
    e.preventDefault()
    if (!this.props.isOnTop) {
      return
    }

    // forward: space w/o shift, enter w/o shift, down arrow, right arrow
    // backward: space w/ shift, enter w/ shift, up arrow, left arrow
    const moveDirection = (((e.keyCode === 32 || e.keyCode === 13) && !e.shiftKey) || e.keyCode === 40 || e.keyCode === 39) ? 1 :
      (((e.keyCode === 32 || e.keyCode === 13) && e.shiftKey) || e.keyCode === 38 || e.keyCode === 37) ? -1 : 0

    if (moveDirection !== 0) {
      if (this.state.visible) {
        const movedRecently = this.lastScrollTime && new Date() - this.lastScrollTime < 500
        let moveToSection = moveDirection + (movedRecently ? this.lastScrollSection : this.state.visible.id)
        let partialAdvance = false
        if (!movedRecently) {
          if (moveDirection > 0) { // if moving forwards, check to see if the current sections's text trails off the end of the screen
            const section = this.linkRefs[moveToSection]
            partialAdvance = section && section.ref.current && section.ref.current.node.getBoundingClientRect().top > window.innerHeight
          } else { // if moving backwards, check that the top is in sight
            const section = this.linkRefs[moveToSection + 1]
            moveToSection += section && section.ref.current && section.ref.current.node.getBoundingClientRect().bottom < 0 ? 1 : 0
          }
        }
        this.scrollTo(moveToSection, partialAdvance, true)
      }
    }
  }

  scrollTo(moveToSection, partialAdvance, smooth) {
    this.lastScrollTime = new Date()

    if (partialAdvance) {
      this.lastScrollSection = moveToSection - 1
      window.scrollBy({top: window.innerHeight * 0.66, behavior: smooth ? "smooth" : "auto"})
      return
    }

    const section = this.linkRefs[moveToSection]
    if (section && section.ref.current) {
      this.lastScrollSection = moveToSection
      const rect = section.ref.current.node.getBoundingClientRect()
      window.scrollTo({
        top: window.pageYOffset + rect.top + (moveToSection !== 1 ? rect.height / 2 : 0),
        behavior: smooth ? "smooth" : "auto",
      })
    }
    this.hasScrolled = true
  }

  addAnchor(id, ref, savePoints, isSaveOwner) {
    const section = {id, ref, savePoints}
    this.linkRefs[id] = section
    savePoints.forEach(savePoint => {
      this.linkRefs[savePoint] = section
    })

    if (!this.hasScrolled && isSaveOwner) {
      if (savePoints.some(savePoint => ("#" + savePoint === this.savePointAtLoadTime))) {
        this.scrollTo(id - 1, false, false)
      }
    }
  }

  onSectionVisibilityChange(id, visible, timeline, bgmTimeline, seTimeline) {
    if (!!this.visible[id] === visible) {
      return // exit early if there is no change
    }

    if (visible) {
      this.visible[id] = {id, timeline, bgmTimeline, seTimeline}
    } else {
      delete this.visible[id]
    }
    // try to only run setState once
    clearTimeout(this.time)
    this.time = setTimeout(() => {
      const visible = Object.assign({}, this.includeCallbacks, Object.keys(this.visible).reduce((a, b) => (a.id > this.visible[b].id ? a : this.visible[b]), {id: 0}))
      // nextVisible is used to update scroll watchers (not all scroll watchers are enabled at once,
      // so even if all scroll watchers have updated,
      // there may be disabled scroll watchers which need to update before we perform the (expensive) asset load
      this.setState({nextVisible: visible})

      if (new Date() - this.lastJumpTime < 200) { // if we've jumped recently
        this.time = setTimeout(() => this.setState({visible}), 200) // wait a moment to see if another jump happens
      } else {
        this.setState({visible})
      }
      this.lastJumpTime = new Date()
    }, 1)
  }

  render() {
    return <ScrollProvider value={this.state.nextVisible}>
      <AnimationProvider value={this.state.visible}>
        {this.props.options.debugLevel !== 0 && <div style={{position: "fixed", backgroundColor: "darkred"}}>
          {this.state.visible.id}<br/>{this.state.nextVisible.id}
        </div>}

        {this.props.children}
      </AnimationProvider>
    </ScrollProvider>
  }
}

const withScrollDetect = Component => (
  props => (
    <ScrollConsumer>
      {value => <Component {...props} scroll={value}/>}
    </ScrollConsumer>
  )
)

const withScroll = Component => (
  props => (
    <AnimationConsumer>
      {value => <Component {...props} animation={value}/>}
    </AnimationConsumer>
  )
)

ScrollWatcher = withOptions(withRouter(ScrollWatcher))
export {ScrollWatcher, withScrollDetect, withScroll}
