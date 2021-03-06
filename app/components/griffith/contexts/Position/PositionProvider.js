import React from 'react'
import PropTypes from 'prop-types'
import {css} from 'aphrodite/no-important'
import {reduce} from 'griffith-utils'
import elementResizeEvent from 'element-resize-event'
import PositionContext from './PositionContext'
import styles from './styles'

export default class PositionProvider extends React.PureComponent {
  static propTypes = {
    shouldObserveResize: PropTypes.bool,
  }

  state = {
    videoWidth: 0,
    videoHeight: 0,
    isFullWidth: false,
    helperImageSrc: null,
  }

  ref = React.createRef()

  componentDidMount() {
    if (this.props.shouldObserveResize) {
      this.startObservingResize()
    }
    this.triggerUpdateIsFullWidth()
    this.updateHelperImageSrc()
  }

  componentDidUpdate(prevProps, prevState) {
    const {shouldObserveResize: prevShouldObserve} = prevProps
    const {videoWidth: prevWidth, videoHeight: prevHeight} = prevState
    const {shouldObserveResize} = this.props
    const {videoWidth, videoHeight} = this.state

    if (prevWidth !== videoWidth || prevHeight !== videoHeight) {
      this.triggerUpdateIsFullWidth()
      this.updateHelperImageSrc()
    }

    if (!prevShouldObserve && shouldObserveResize) {
      this.startObservingResize()
    }
    if (prevShouldObserve && !shouldObserveResize) {
      this.stopObservingResize()
    }
  }

  componentWillUnmount() {
    this.stopObservingResize()
  }

  startObservingResize = () => {
    const root = this.ref.current
    if (root) {
      elementResizeEvent(root, this.updateIsFullWidth)
    }
  }

  stopObservingResize() {
    const root = this.ref.current
    if (root) {
      elementResizeEvent.unbind(root)
    }
  }

  updateHelperImageSrc = () => {
    const {videoWidth, videoHeight} = this.state
    if (!videoWidth || !videoHeight) {
      return
    }
    const [width, height] = reduce(videoWidth, videoHeight)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const helperImageSrc = canvas.toDataURL()
    this.setState({helperImageSrc})
  }

  updateIsFullWidth = () => {
    const {videoWidth, videoHeight} = this.state
    if (!videoWidth || !videoHeight) {
      return
    }
    const root = this.ref.current
    if (!root) return

    const {width, height} = root.getBoundingClientRect()
    // ???????????????????????????????????????????????????????????????????????????????????? 0.01 ??????????????????
    // ?????? 1280x720 (1.777777778) ??? 848x478 (1.774058577)??????????????????
    const isFullWidth = width / height - videoWidth / videoHeight <= 0.01
    if (isFullWidth !== this.state.isFullWidth) {
      this.setState({isFullWidth})
    }
  }

  triggerUpdateIsFullWidth = () => requestAnimationFrame(this.updateIsFullWidth)

  updateVideoSize = ({videoWidth, videoHeight}) => {
    this.setState({videoWidth, videoHeight})
  }

  render() {
    const {children} = this.props
    const {isFullWidth, helperImageSrc} = this.state
    return (
      <PositionContext.Provider
        value={{
          isFullWidth,
          helperImageSrc,
          updateVideoSize: this.updateVideoSize,
        }}
      >
        <div className={css(styles.root)} ref={this.ref}>
          {children}
        </div>
      </PositionContext.Provider>
    )
  }
}
