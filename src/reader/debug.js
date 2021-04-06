import React from "react"

const {Provider, Consumer} = React.createContext({debugLevel: 0})
const {Provider: OptsProvider, Consumer: OptsConsumer} = React.createContext({debugLevel: 0})

const withDebug = Component => (
  props => (
    <Consumer>
      {value => <Component {...props} debug={value}/>}
    </Consumer>
  )
)

const withOptions = Component => (
  props => (
    <OptsConsumer>
      {value => <Component {...props} options={value}/>}
    </OptsConsumer>
  )
)


export {Provider, OptsProvider, withDebug, withOptions}
