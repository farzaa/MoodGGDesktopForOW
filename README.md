# MoodGGDesktopForOW

This repo readme *mainly* discusses how to run the code. If you don't know what mood.gg is or don't know what the point of this desktop is please read the blog post [here](https://medium.com/@farzatv/deepoverwatch-combining-tensorflow-js-overwatch-and-music-1a84d4598bc0) and check out the actual website [here](https://mood.gg) :).

To actually run the app locally, simply pull the repo and do ```npm install && npm start``` within the root directory.

*So why is this desktop app special?* Well, it uses the very recently release TensorFlow.js for a pretty interesting task. To detect + predict what character a person is playing in Overwatch **all in real-time and all within the browser**. **No** Python, **no** crazy dependencies.

It detects the character a person is playing in Overwatch by taking screenshots while they are in a game and runs them through my [DeepOverwatch](https://github.com/farzaa/DeepOverwatch) model. *But*, DeepOverwatch is all Keras based, which is written in Python. For this desktop app, I converted my trained Keras/Python based DeepOverwatch model to a TensorFlow.js model. I than load that model within TensorFlow.js and run the user's live gameplay screenshots, which are taken with [this](https://www.npmjs.com/package/screenshot-desktop) library, through the TensorFlow.js ```predict``` function to find out the character a person is playing! That means I never use Python within the actual desktop app anywhere I just use the converted TensorFlow.js model awesome!

All the TensorFlow.js magic happens at *renderer.js*. It is very straightforward, so just take a look at it starting at ```loadModel()``` :).

I also use OpenCV.js to cover an edge case. When the *Play of the Game* screen is shown, the UI will change completely to mimic the overlay of the original player. That means the desktop app *thinks* that the actual user switched characters so it will switch playlists. But thats not true! The overlay just changes! To fix this, I do a quick template match to check and see if the user is on the *Play of the Game* screen before switching playlists.
