(function () {
    var doorChannel;
    var script = this;
    script.preload = function (uuid) {
        Messages.subscribe(uuid);
        doorChannel = uuid;
    }
    this.enterEntity = function (uuid) {
        Messages.sendMessage(doorChannel, JSON.stringify({
            action: "enterZone"
        }));
    };
    this.leaveEntity = function (uuid) {
        Messages.sendMessage(doorChannel, JSON.stringify({
            action: "leaveZone"
        }));
    };
    script.unload = function () {
        Messages.unsubscribe(doorChannel);
    }
});