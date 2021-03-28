import React from "react"
import {BrowserRouter as Router, Link, Route, Switch} from "react-router-dom"
import Reader from "../reader/reader"

const Index = (props) => (
  <Router>
    <Switch>
      <Route exact path="/">
        Home Page
        <br/>
        <Link to="プロローグ1日目">プロローグ1日目</Link>
        <br/>
        <Link to="プロローグ2日目">プロローグ2日目</Link>
        <br/>
        <Link to="プロローグ3日目">プロローグ3日目</Link>
      </Route>
      <Route path={["/:script/:save", "/:script"]}>
        <Reader/>
      </Route>
    </Switch>
  </Router>
)

export default Index
