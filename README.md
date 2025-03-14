# KiriKiri Web

A [KiriKiri](https://en.wikipedia.org/wiki/List_of_visual_novel_engines#KiriKiri) engine specifically written to power the [web version of Fate/Stay Night](https://fatestaynight.vnovel.org).

## Social

Join [our Discord](https://discord.gg/ejespgUpgg)!

## Development

PRs welcome!

To get the project running, you will need node installed, then simply:

1. Clone the repo.
2. Run `npm ci` to install dependencies.
3. Run `npm start` to start the development server.
4. Navigate to https://localhost:3000.

Note that:

- Changes to source files will be reloaded automatically.
- Static assets will be loaded on-demand from the live site, so an internet connection is required. (See `"proxy"` in [package.json](./package.json))

## How it Works / Repo Organization

Static assets extracted from the original Visual Novel are loaded on demand, these are collected under `https://fatestaynight.vnovel.org/static/`

```shell
├── bgm         # top-level music folder
│   ├── classic # original music
│   ├── ps2     # ps2 music
│   └── vita    # ps vita music
├── images      # top-level images folder
│   ├── eng     # modified / translated
│   ├── h       # alternate versions
│   └── mature  # alternate versions
├── scripts     # script files (*.ks) containing game logic
│   ├── eng     # translated
│   │   └── h   # alternate versions
│   └── jp      # original language
│       └── h   # alternate versions
├── sound       # sound effects
└── voice       # voice lines
```

The exception to this, is a couple indexes which are generated alongside the above assets, but are included directly in this repo.<br/>
(See [lookup.js](./src/resources/lookup.js) and the [generated/](./src/resources/generated) folder for more details.)

Tools for extracting & converting assets are in a separate repo, see https://github.com/Kent-H/kirikiri-web-helper.<br/>
(Please request access via discord.)

### Notable Components

- Most pages are rendered by the [Reader](./src/reader/reader.js) component, which among other things, is responsible for:

    1. Displaying the current scene's text, handling user input & navigation.
    2. Detecting the user's progression through the text.
    3. Displaying the appropriate animation (including music & sounds) for the currently visible text.

- The above text & animations are extracted from KiriKiri scripts, loaded by a separate, dedicated [Script Loader](./src/interpreter/script-loader.js) component, which performs a few logical steps:

    1. [Tokenize](./src/interpreter/parse/tokenize.js) - Reads in a \*.ks file and outputs tokens.
    2. [Interpret](./src/interpreter/parse/interpreter.js) - Receives tokens from tokenizer and updates gamestate.
    3. [Render](./src/interpreter/parse/render.js) - Creates animation segments based on progression of the gamestate.

- A [home page](./src/home/home.js) exists to support navigating the full visual novel, and includes:
    - A short introduction & site tutorial.
    - A graph of every scene, including connectivity between scenes.
