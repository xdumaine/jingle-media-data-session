var util = require('util');
var extend = require('extend-object');
var webrtcsupport = require('webrtcsupport');
var MediaSession = require('jingle-media-session');

function MediaDataSession(opts) {
    MediaSession.call(this, opts);

    this.pc.on('addChannel', this.handleDataChannelAdded.bind(this));
    this._channels = [];
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
    sendDirectly: function (channel, messageType, payload) {
        var message = {
            type: messageType,
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
        if (!webrtcsupport.supportDataChannel) {
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
