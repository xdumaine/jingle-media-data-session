# Jingle Media Data Session

To make sure incoming sessions are created as MediaDataSessions, when you create the jingle SessionManager, override `prepare session` to return a `MediaDataSession` instance.
```javascript

jingle = new Jingle({
    prepareSession: function (opts) {
        return new MediaDataSession(opts);
    }
});
```

When creating outgoing sessions, create a `MediaDataSession` and add it to the jingle SessionManager:

```javascript
var session = new MediaDataSession({
    sid: sid
    peer: jid
    initiator: true
    stream: stream
    parent: jingle
    iceServers: jingle.iceServers
});

jingle.addSession(session);

```

Then, (when your session is started), you can create and use data channels:

```javascript

session.sendDirectly('dataChannelName', 'topic', { payload: 'foobar' });

```

And get channel messages with:

```javascript

jingle.on('channelMessage', function (session, channelName, message) {
    console.log(message.topic, message.payload);
});

// or session.on('channelMessage', handler)

```

## Installing

```sh
$ npm install jingle-media-data-session
```

## Building bundled/minified version (for AMD, etc)

```sh
$ make
```

The bundled and minified files will be in the generated `build` directory.

## License

MIT

## Created by

Xander Dumaine put this together from work done in other jingle and webrtc projects by Lance Stout, Phillip Hancke, and the other &yetis.

If you like this, follow [@xanderdumaine](http://twitter.com/xanderdumaine) [@lancestout](http://twitter.com/lancestout) or [@hcornflower](http://twitter.com/hcornflower) on twitter.
