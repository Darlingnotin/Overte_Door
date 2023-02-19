(function () {
    var clients = 0;
    var doorChannel;
    var clientsStillExistInterval;
    var clientsUuid = [];
    var sound;
    var injectorIsRunning = false;

    var defaultUserData = {
        doorAnimationOpening: {
            firstFrame: 0,
            lastFrame: 62
        },
        doorAnimationClosing: {
            firstFrame: 62,
            lastFrame: 120
        },
        soundEffectUrl: "",
        soundEffectVolume: 0.1,
        doorAnimationFps: 30
    };

    this.preload = function (uuid) {
        doorChannel = uuid;
        var doorEntityProperties = Entities.getEntityProperties(uuid);
        if (doorEntityProperties.userData == "") {
            addDefaultUserData(defaultUserData);
        } else {
            var userData = JSON.parse(doorEntityProperties.userData);
            if (userData.doorAnimationOpening == undefined) {
                userData.doorAnimationOpening = defaultUserData.doorAnimationOpening;
                userData.doorAnimationClosing = defaultUserData.doorAnimationClosing;
                userData.soundEffectUrl = defaultUserData.soundEffectUrl;
                userData.soundEffectVolume = defaultUserData.soundEffectVolume;
                userData.doorAnimationFps = defaultUserData.doorAnimationFps;
                addDefaultUserData(userData);
            } else {
                defaultUserData.doorAnimationOpening = userData.doorAnimationOpening;
                defaultUserData.doorAnimationClosing = userData.doorAnimationClosing;
                defaultUserData.soundEffectUrl = userData.soundEffectUrl;
                defaultUserData.soundEffectVolume = userData.soundEffectVolume;
                defaultUserData.doorAnimationFps = userData.doorAnimationFps;
            }
        }
        listenForClientEnterZone(uuid);
    };

    function addDefaultUserData(data) {
        Entities.editEntity(doorChannel, {
            userData: JSON.stringify(data)
        });
    }

    function clientInZone(uuid) {
        var e = Entities.getEntityProperties(uuid);
        Entities.editEntity(e.parentID, {
            animation: {
                running: true,
                firstFrame: defaultUserData.doorAnimationOpening.firstFrame,
                lastFrame: defaultUserData.doorAnimationOpening.lastFrame,
                currentFrame: 30,
                fps: defaultUserData.doorAnimationFps,
                loop: false,
            }
        })
        checkClientStillExists();
        Script.setTimeout(function () {
            Entities.editEntity(e.parentID, {
                collisionless: true,
            })
        }, Math.floor(((defaultUserData.doorAnimationOpening.lastFrame - defaultUserData.doorAnimationOpening.firstFrame) * 1000) / defaultUserData.doorAnimationFps));
    }

    function clientNotInZone(uuid) {
        var e = Entities.getEntityProperties(uuid);
        Entities.editEntity(e.parentID, {
            collisionless: false,
            animation: {
                running: true,
                firstFrame: defaultUserData.doorAnimationClosing.firstFrame,
                lastFrame: defaultUserData.doorAnimationClosing.lastFrame,
                currentFrame: 30,
                fps: defaultUserData.doorAnimationFps,
                loop: false
            }
        })
        Script.clearInterval(clientsStillExistInterval);
    }

    function listenForClientEnterZone(uuid) {
        Messages.subscribe(uuid);
        Messages.messageReceived.connect(onMessageReceived);
        function onMessageReceived(channel, message, sender, localOnly) {
            if (channel != uuid) {
                return;
            }
            messageData = JSON.parse(message);
            var doorEntityProperties = Entities.getEntityProperties(doorChannel);
            var userData = JSON.parse(doorEntityProperties.userData);
            defaultUserData.doorAnimationOpening = userData.doorAnimationOpening;
            defaultUserData.doorAnimationClosing = userData.doorAnimationClosing;
            defaultUserData.soundEffectUrl = userData.soundEffectUrl;
            defaultUserData.soundEffectVolume = userData.soundEffectVolume;
            defaultUserData.doorAnimationFps = userData.doorAnimationFps;
            if (messageData.action == "enterZone") {
                clientsUuid.push(sender);
                clients++;
                if (clients == 1) {
                    clientInZone(uuid);
                }
            } else if (messageData.action == "leaveZone") {
                clients--;
                removeClientFromArray(sender);
                if (clients <= -1) {
                    clients = 0;
                }
                if (clients == 0) {
                    clientNotInZone(uuid);
                }
            }
        }
    }

    function checkClientStillExists() {
        clientsStillExistInterval = Script.setInterval(function () {
            currentClientList = AvatarList.getAvatarIdentifiers();
            clientsUuid.forEach(function (uuid) {
                doesClientStillExist(uuid, currentClientList);
            });
        }, 1000);
    }

    function doesClientStillExist(uuid, currentClientList) {
        var clientExists = false;
        var numberInArray;
        for (var i = 0; i < currentClientList.length; i++) {
            if (currentClientList[i] == uuid) {
                clientExists = true;
                numberInArray = i;
            }
        }
        if (!clientExists) {
            clients--;
            removeClientFromArray(uuid);
        }
    }

    function removeClientFromArray(uuid) {
        var numberInArray;
        for (var i = 0; i < clientsUuid.length; i++) {
            if (clientsUuid[i] == uuid) {
                numberInArray = i;
            }
        }

        clientsUuid.splice(numberInArray);
        if (clients == 0) {
            clientNotInZone(doorChannel);
        }
    }

    this.unload = function () {
        Messages.unsubscribe(doorChannel);
        Messages.messageReceived.disconnect(onMessageReceived);
    }
});