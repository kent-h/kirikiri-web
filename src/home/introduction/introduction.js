import React from "react"
import "./introduction.css"

const Introduction = () =>
  <>
    <div className="introduction">
      {/*<img className="introduction-image" src={"/static/images/" + "tb_logo6_fate" + ".webp"} alt=""/>*/}
      <div className="introduction-text resizable-text text-shadow">
        <div style={{
          position: "relative",
          fontSize: "larger",
          textAlign: "center",
        }}>
          <span style={{whiteSpace: "pre"}}>
            Hold on, where am I?
          </span> <span style={{whiteSpace: "pre"}}>
          And what's all this about then?
        </span>
        </div>
        <br/>
        This is a web version of <i>Fate/Stay Night</i>,
        a <a style={{color: "lightblue"}}
             href="https://en.wikipedia.org/wiki/Fate/stay_night">visual novel by Type-Moon</a>.
        It is intended to be used for cross-referencing, to easily find & re-read scenes.
        <br/>
        <br/>
        <i>TL;DR: Scroll down & click any scene to go read it.</i> You can press &lt;ESC&gt; at any time to adjust
        settings.
        <br/>
        <br/>
        First, a disclaimer: If you are looking to read the Fate/Stay Night VN, I <i>highly</i> recommend installing it
        rather than trying to read it here.
        Saving, loading, flags, achievements, and most of the choose-your-own-path gameplay is missing;
        you're also probably going to end up seeing spoilers that you shouldn't, or end up on the wrong path.
        See <a style={{color: "lightblue"}}
               href="https://www.reddit.com/r/fatestaynight/comments/7qh6ho/fatestay_night_vn_installation_guide_vii/">
        this reddit thread</a> for a very good installation guide.
        <br/>
        <br/>
        If for whatever reason you wish to experience this version of <i>Fate/</i>,
        read each scene in order (from top to bottom),
        keeping to the first route (the left-most path).
        Only read the next route when you've completed the previous.
        <br/>
        <br/>
        <br/>
        Still here? Alrighty then, let's get down to business.
        <br/>
        <br/>
        Below is a graph of the whole Fate/Stay Night VN, you can click on any scene to go read it.
        <br/>
        You can either scroll through like a normal web page,
        or alternatively use the arrow keys, &lt;Enter&gt;, or &lt;Space&gt; to navigate.
        <br/>
        <br/>
        You'll notice that the page detects how far you've scrolled,
        and uses this to set the appropriate music, play animations & sounds,
        and generally replicate the experience of reading in the VN.
        <br/>
        In addition, the page's URL will update as you progress.
        You can save this URL at any time to return to the same spot later, or to send someone else there.
        <br/>
        <br/>
        Press &lt;ESC&gt; at any time to access the settings menu
        (on mobile, this can be opened using the <i>tick</i> in the top-left corner).
        <br/>
        You can also use '~' (tilda) to cycle through debug modes (and to turn it off in case you hit it by accident).
        <br/>
        <br/>
        <br/>
        The code is <a style={{color: "lightblue"}}
                       href="https://github.com/Kent-H/kirikiri-web">available on github</a>.
        (There is a secondary repo containing conversion scripts & other tools which is private for now,
        please reach out if you would like access.)
        <br/>
        <br/>
        <br/>
        <div style={{fontSize: "larger", textAlign: "center"}}>Acknowledgements</div>
        <br/>
        This project was inspired by
        Seorin's <a style={{color: "lightblue"}} href="https://lparchive.org/Fatestay-night/">F/SN playthroughs</a> over
        on the <a style={{color: "lightblue"}} href="https://lparchive.org/">Let's Play Archive</a>.
        I originally went searching for a text-only version of <i>fate/</i> to facilitate searching & cross-referencing,
        but Seorin's work demonstrated to me that the whole game could be very comfortably enjoyed in a plain-text
        format.
        All I really thought was missing was a dark theme,
        and some way to have music queued up automatically in the background.
        <br/>
        <br/>
        A special thanks to the Mirror-Moon team, it has been a joy to read through & reverse-engineer the source code.
        Bits of each contributor's personality are scattered throughout, and it has been a truly unique experience to
        open up a project that's been meticulously curated by so many passionate people over the years.
        None of this would have been possible without relying on their work.
        <br/>
        <br/>
        And of course, thanks to Type-Moon, and to Mr. Nasu himself, for creating this universe that we all love so
        much.
        A special form of thanks is deserved here, for allowing the existence of these fan projects; not only for this
        one, but for each and every project which paves the way for the next.
        <br/>
        <br/>
        So I shall add my name to the list of people who have said these same words over the years:
        <br/>
        <br/>
        <div style={{textAlign: "center"}}>
          <i>Thanks for playing</i>,
        </div>
        <br/>
        <div style={{textAlign: "center"}}>
          - Kent Hagerman
        </div>
        <br/>
        <div className="introduction-hr"/>
      </div>
    </div>
  </>

export default Introduction
