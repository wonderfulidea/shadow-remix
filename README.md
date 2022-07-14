# Shadow Remix

#TODO: add image and overview of project

- [Overview](#overview)
  - [Shadow Remix App](#shadow-remix-app)
  - [Online Gallery](#online-gallery)
  - [Gallery Admin Interface](#gallery-admin-interface)
  - [Arduino](#arduino)
  - [Repo Structure](#repo-structure)
- [Use](#use)
- [License](#license)
- [Hotkeys](#hotkeys)
- [Limitations](#limitations)
- [Parts List](#parts-list)
- [Schematics and PCB](#schematics-and-pcb)
- [Backend Setup](#backend-setup)
- [Serial Communication](#serial-communication)
- [Code](#code)
  - [Install nodejs and npm](#install-nodejs-and-npm)
  - [Compiling UI Library](#compiling-ui-library)
  - [Compiling Desktop App](#compiling-desktop-app)
  - [Compiling Gallery](#compiling-gallery)


## Overview

This project consists of a few pieces of code that interact with each other:

### Shadow Remix App

TODO: add image

The Shadow Remix drawing interface is available both as javascript code that runs in a web browser *or* as a compiled desktop app for Windows and Mac.  A live demo of the code is hosted at [TODO: add public link]().

The browser-based drawing interface does not have the ability to upload photos to [our online gallery](TODO: add link) due to security issues (we don't want to let anyone on the internet upload photos to the gallery), but it does let users save images to their computers.

You will need to [compile your own copy of the desktop Shadow Remix drawing interface](#compiling-desktop-app) with credentials for editing your database.


### Online Gallery

TODO: add image

The gallery is a separate web app that displays approved photos drawn by visitors at the museum exhibition.  It has a feature where any new (unapproved) drawing made in the museum is shown for a brief period and then hidden until it is [approved by an admin](#gallery-admin-interface).

The gallery is currently hosted at [TODO: add public link]().


### Gallery Admin Interface

TODO: add image

The gallery admin interface is a private web app that displays saved photos drawn by visitors at the museum exhibition and allows an admin to approve them for public viewing.  You will need to [compile and host your own copy of the admin interface](#compiling-gallery) with credentials for editing your database.


### Arduino

TODO: add image

The museum exhibit features a motorized shadow-making setup and a panel of button controls for easier interaction.  All the electronics for this exhibit are controlled by an [Arduino](https://www.arduino.cc/) which communicates via USB to the desktop app.


### Repo Structure

This repo consists of several subdirectories:

- [app](app) folder contains both a standalone browser-based application for shadow remix and the UI library code for connecting to a webcam, drawing to the screen, and saving images.
- [electron](electron) folder has code for compiling the desktop app with [Electron](https://www.electronjs.org/), it depends on the UI codebase located within the `app` folder.
- [gallery](gallery) folder has code for a publicly accessible gallery webpage showing images uploaded by users.
- [gallery-admin](gallery-admin) folder has code for a private admin interface for approving images.
- [arduino](arduino) folder contains arduino code for connecting hardware buttons to the app.


## Use

TODO: public url (web browser): 

You need to compile your own Windows (64 and 32 bit) and Mac installers following the instructions for [compiling the desktop app](#compiling-desktop-app).  Once built, you should be able to install the app on any desktop setup.  These app is not signed and may require some additional steps to open:

- On Mac, hold down the control key and right click on the application icon, then select `Open`.  Confirm that you would like to open the application by an unidentified developer.  You should only need to do this the first time you run the application.  More info [here](https://support.apple.com/guide/mac-help/open-a-mac-app-from-an-unidentified-developer-mh40616/mac).
- On Windows... TODO: finish this.

The first time you open the app, it will ask permission to access the webcam in a pop-up dialog.


## License

This work is distributed under an MIT license with exception to the "Lunch" font by Anthem Type.  See [Lunch Font](https://www.fontspace.com/lunch-font-f3679) for more details about licensing.


## Hotkeys

This app is primarily intended for use in a museum environment via a touchscreen and peripheral button controls.  If you have access to a keyboard, you can also use the following hotkeys:

- `ctrl/command` + `z` to undo
- `ctrl/command` + `s` to save image
- `backspace/delete` to clear
- `c` brings up a dialog for selecting the webcam device
- `p` brings up a dialog for selecting the serial port (desktop app only)
- `v` saves your current drawing as an animated video (webm format).  Webm videos are large and difficult to play, but very fast to save – which is why we use them.  See instructions [here](https://github.com/amandaghassaei/canvas-capture#converting-webm-to-other-formats) for converting to mp4.  You can also use video editing software like Adobe Premiere to convert the video format.
- `h` puts the app into screen saver mode (desktop app only).


## Limitations

- Currently, this app expects to receive webcam feeds in landscape orientation and renders out at the resolution specified in [app/src/constants.ts](app/src/constants.ts).  I've noticed that when mobile devices are in portrait mode, the returned width and height from `getUserMedia()` look like the stream is still in landscape.  I have not found a consistent way to correct this yet.


## Parts List

See [docs/Parts_List.md](docs/Parts_List.md) for a list of hardware we used for our exhibit.


## Schematics and PCB

See [docs/PCB.md](docs/PCB.md) for schematics and info about making circuit boards for the exhibit.


## Backend Setup

TODO: change gallery link.
This app uses an AWS S3 bucket to store saved images in the cloud.  The saved images can be viewed through a webpage at []().  Info about configuring the AWS Backend can be found at [docs/Backend_Setup.md](docs/Backend_Setup.md).


## Serial Communication

The serial communication protocol between the desktop app and Arduino is described in [docs/Serial_Communication.md](docs/Serial_Communication.md).  All arduino code can be found in the [arduino](arduino) folder.


## Code

### Install nodejs and npm

Before you compile any part of the code, you will need to [install nodejs and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) on your machine.  All compilation steps are done through the command line.


### Compiling UI Library

This repo comes with a pre-built version of the UI library, located at [app/dist/ui.js](app/dist/ui.js).  This library should be fine as is for most cases.  **If you do not plan to modify the UI code, skip to the [next section](#compiling-desktop-app).**

If you want to change the available colors, line thicknesses, and other aspects of the UI, you can make those edits within
[app/src/constants.ts](app/src/constants.ts).

After make changes to the UI code you need to compile the `app/src/` folder to `app/dist/` using the following commands:

First, [install nodejs and npm](#install-nodejs-and-npm).

In the terminal, navigate to the `app` directory:
```sh
cd app
```

Install all dependencies:
```sh
npm install
```

Compile with [Webpack](https://webpack.js.org/):
```sh
npm run build
```

You can also start a development server at [localhost:8080/](http://localhost:8080/) using the following command:
```sh
npm run start
```


### Compiling Desktop App

The javascript code in this repo is compiled with [Electron](https://www.electronjs.org/) so that it can be run as a desktop app (rather than in a web browser).

You will need to compile your own desktop app after following the steps to [set up an AWS bucket and permissions](docs/Backend_Setup.md) and create an `.env` file with your access keys.  If make changes to the UI library in the `app` directory, you will need to [compile it first](#compiling-ui-library) before compiling a new copy of the desktop app.

The desktop app features a screensaver mode where you can show animations of previously drawn shadow-remixes if the station has remained inactive for a period of time.  To enable this, you need to create a folder at `electron/animations/` and add several videos to this folder (preferably mp4).  After making these changes you will need to recompile the app.  Alternatively, if you would like to change these videos (or add new ones) without recompiling the app, you can edit the contents of the `resources/animations/` folder in the app's build and restart the app (on Mac, right click on the app's icon and select "Show Package Contents", on Windows right click on the app's icon and select "More > Open file location").  To be safe, use filenames without spaces for any animations you add to the app.

If you want to change things about the app's functionality (e.g. wait time before showing the screensaver, or which buttons map to which functions) you can make those edits within
[electron/src/constants.ts](electron/src/constants.ts).

To compile for Windows and Mac:

First, [install nodejs and npm](#install-nodejs-and-npm).

In the terminal, navigate to the `electron` directory:
```sh
cd electron
```

Install all dependencies:
```sh
npm install
```

To compile for Windows and Mac:
```sh
npm run build
```

Once complete, builds are located in the `electron/build` folder.  The `shadow-remix Setup #.#.#.exe` installer should work on 32bit and 64 bit Windows machines, and the `shadow-remix-#.#.#.dmg` or `shadow-remix-#.#.#-mac.zip` files contain builds for Mac.

If you would like to compile for Linux, edit the following line in [electron/package.json](electron/package.json):

```json
"build": "npm run compile && electron-builder -mw",
```

change to:

```json
"build": "npm run compile && electron-builder -mwl",
```

Then run:

```sh
npm run build
```

Linux build has not been tested and may require additional configs, see the [electron-builder docs](https://www.electron.build/multi-platform-build.html) for more information.

If you want to make changes to the app's code, you can quickly test them by running a local development server:
```sh
npm run start
```
This will open an app window and begin running the new code automatically.


### Compiling Gallery

This repo comes with a pre-built version of our public gallery, located at [gallery/dist/](gallery/dist/) and currently hosted at XXXX.

In order to view your own images, you will need to recompile the gallery after [setting up your AWS bucket and permissions](docs/Backend_Setup.md) and creating a `.env` file with your access keys.

You can also edit some parameters of the gallery (e.g. how long images stay up, how often to refresh) at the top of [gallery/src/index.ts](gallery/src/index.ts).

Once complete, compile the `gallery/src/` folder to `gallery/dist/` using the following commands:

First, [install nodejs and npm](#install-nodejs-and-npm).

In the terminal, navigate to the `gallery` directory:
```sh
cd gallery
```

Install all dependencies:
```sh
npm install
```

Compile with [Webpack](https://webpack.js.org/):
```sh
npm run build
```

You can also start a development server at [localhost:8080/](http://localhost:8080/) using the following command:
```sh
npm run start
```

Note that you will also need to add `http://localhost:8080` to you list of Allowed Origins in the [AWS backend setup](https://github.com/amandaghassaei/shadow-remix/blob/main/docs/Backend_Setup.md#enable-cross-origin-requests).

Follow these same instructions to compile the gallery admin interface (located in the [gallery-admin](gallery-admin) folder).  Once compiled, the files inside [gallery-admin/dist/](gallery-admin/dist/) can be run locally or [hosted behind a password protected server](docs/Backend_Setup.md#hosting-private-admin-server) to allow admins to approve new image that are saved from the app.  **Do not post the compiled gallery-admin interface publicly because it contains your AWS secrete keys!!**  By default, all files in `gallery-admin/dist` (with the exception of index.html) should be ignored from git.

You can edit some parameters of the gallery admin interface (e.g. how often to refresh) at the top of [gallery-admin/src/index.ts](gallery-admin/src/index.ts).
