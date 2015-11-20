var util = require('util');
var extend = require('extend-object');
var MediaSession = require('jingle-media-session');

function MediaDataSession(opts) {
    MediaSession.call(this, opts);

    this.pc.on('addChannel', this.handleDataChannelAdded.bind(this));
    this._channels = {};
}

util.inherits(MediaDataSession, MediaSession);


Object.defineProperties(MediaDataSession.prototype, {
    channels: {
        get: function () {
            return this._channels;
        }
    }
});

MediaDataSession.prototype = extend(MediaDataSession.prototype, {

    start: function (constraints, next) {
        //cause create data channel apriori
        this.getDataChannel('jingle-media-session');
        MediaSession.prototype.start.call(this, constraints, next);
    },

    sendDirectly: function (channel, messageType, creator, payload) {
        var message = {
            type: messageType,
            creator: creator,
            payload: payload
        };
        var dataChannel = this.getDataChannel(channel);
        if (dataChannel.readyState != 'open') {
            return false;
        }
        dataChannel.send(JSON.stringify(message));
        return true;
    },

    getDataChannel: function (name, opts) {
        if (!this.pc.createDataChannel) {
            return this.emit('error', new Error('createDataChannel not supported'));
        }
        var channel = this.channels[name];
        opts = opts || {};
        if (channel) {
            return channel;
        }
        channel = this.channels[name] = this.pc.createDataChannel(name, opts);
        this._observeDataChannel(channel);
        return channel;
    },

    switchStream: function (oldStream, newStream, cb) {
        var self = this;

        cb = cb || function () {};

        var desc = this.pc.localDescription;
        desc.contents.forEach(function (content) {
            delete content.transport;
            delete content.description.payloads;
        });

        this.pc.removeStream(oldStream);
        this.send('source-remove', desc);

        this.pc.addStream(newStream);
        this.pc.handleOffer({
            type: 'offer',
            jingle: this.pc.remoteDescription
        }, function (err) {
            if (err) {
                self._log('error', 'Could not process offer for switching streams');
                return cb(err);
            }
            self.pc.answer(function (err, answer) {
                if (err) {
                    self._log('error', 'Could not process answer for switching streams');
                    return cb(err);
                }
                answer.jingle.contents.forEach(function (content) {
                    delete content.transport;
                    delete content.description.payloads;
                });
                self.send('source-add', answer.jingle);
                cb();
            });
        });
    },

    handleDataChannelAdded: function (channel) {
        this.channels[channel.label] = channel;
        this._observeDataChannel(channel);
    },

    _observeDataChannel: function (channel) {
        var self = this;
        channel.onclose = this.emit.bind(this, 'channelClose', channel);
        channel.onerror = this.emit.bind(this, 'channelError', channel);
        channel.onmessage = function (event) {
            self.emit('channelMessage', self, channel.label, JSON.parse(event.data), channel, event);
        };
        channel.onopen = this.emit.bind(this, 'channelOpen', channel);
    }
});

module.exports = MediaDataSession;
