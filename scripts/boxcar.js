/**
 * Boxcar SDK JavaScript API
 * @author jpcarlino
 *
 * @requires ../node_modules/crypto-js/crypto-js.js
 */

/*globals window,CryptoJS,Notification,Headers,Request,fetch,ServiceWorkerRegistration */

/**
 * Helper object to encapsulate the push service URL
 * @param host
 * @param scheme
 * @param port
 * @returns
 */
function BoxcarPushHost(host,scheme,port) {
    'use strict';
    if ( !(this instanceof BoxcarPushHost) ) {
        throw new Error("Constructor called as a function");
    }
    this.host = host;
    this.scheme = scheme || "https";
    this.port = port || null;
}
BoxcarPushHost.prototype.getHost = function() {
    'use strict';
    return this.host;
};
BoxcarPushHost.prototype.getScheme = function() {
    'use strict';
    return this.scheme;
};
BoxcarPushHost.prototype.getPort = function() {
    'use strict';
    return this.port;
};
BoxcarPushHost.prototype.getURL = function(method,resource,jsonPayload,credentials,signer) {
    'use strict';
    var url = '',
        normalizedResource = resource;

    if (!!normalizedResource) {
        if ( normalizedResource.endsWith('/') ) {
            normalizedResource = normalizedResource.substring(0, normalizedResource.length() - 1);
        }
        if ( !normalizedResource.startsWith('/') ) {
            normalizedResource = '/' + normalizedResource;
        }
    } else {
        normalizedResource = '/';
    }

    var signature = signer.sign(method, this.host,
            resource,
            (jsonPayload ? JSON.stringify(jsonPayload) : ''),
            credentials.getBoxcarClientSecret());

    return url.concat(this.scheme.toLowerCase(),'://',
                       this.host.toLowerCase(),
                       (!!this.port ? ':'+this.port : ''),
                       normalizedResource,
                       '?clientkey=',credentials.getBoxcarClientKey(),
                       '&signature=',signature);
};

/**
 * Helper object to encapsulate credentials needed to register on Boxcar SaaS
 * @param gcmSenderId
 * @param boxcarClientKey
 * @param boxcarClientSecret
 * @returns
 */
function BoxcarCredentials(boxcarClientKey, boxcarClientSecret) {
    'use strict';
    if ( !(this instanceof BoxcarCredentials) ) {
        throw new Error("Constructor called as a function");
    }
    this.gcmSenderId = 'unknown';
    this.boxcarClientKey = boxcarClientKey;
    this.boxcarClientSecret = boxcarClientSecret;
}
BoxcarCredentials.prototype.getGCMSenderId = function() {
    'use strict';
    return this.gcmSenderId;
};
BoxcarCredentials.prototype.getBoxcarClientKey = function() {
    'use strict';
    return this.boxcarClientKey;
};
BoxcarCredentials.prototype.getBoxcarClientSecret = function() {
    'use strict';
    return this.boxcarClientSecret;
};

/**
 * Boxcar configuration parameters
 * @param boxcarCredentials
 * @param pushHost (optional)
 */
function BoxcarConfig(boxcarCredentials, serviceWorker, appVersion, pushHost) {
    'use strict';
    if ( !(this instanceof BoxcarConfig) ) {
        throw new Error("Constructor called as a function");
    }
    this.enableUDID = true;
    this.pushHost = pushHost || new BoxcarPushHost("console.boxcar.io", "https", 443);
    this.boxcarCredentials = boxcarCredentials;
    this.appVersion = appVersion || "unknown";
    this.deviceName = !!(jscd) ? jscd.browser +' '+ jscd.browserVersion : null;
    this.osVersion = !!(jscd) ? jscd.os +' '+ jscd.osVersion : "chrome";
    this.debugEnabled = false;
    this.debugConsole = window.console;
    this.serviceWorker = serviceWorker;
}
BoxcarConfig.prototype.isUDIDEnabled = function() {
    'use strict';
    return this.enableUDID;
};
BoxcarConfig.prototype.setUDIDEnabled = function(enabled) {
    'use strict';
    this.enableUDID = enabled;
    return this;
};
BoxcarConfig.prototype.getPushHost = function() {
    'use strict';
    return this.pushHost;
};
BoxcarConfig.prototype.getBoxcarCredentials = function() {
    'use strict';
    return this.boxcarCredentials;
};
BoxcarConfig.prototype.setBoxcarCredentials = function(boxcarCredentials) {
    'use strict';
    this.boxcarCredentials = boxcarCredentials;
    return this;
};
BoxcarConfig.prototype.getAppVersion = function() {
    'use strict';
    return this.appVersion;
};
BoxcarConfig.prototype.setAppVersion = function(appVersion) {
    'use strict';
    this.appVersion = appVersion;
    return this;
};
BoxcarConfig.prototype.getDeviceName = function() {
    'use strict';
    return (!!this.deviceName ? this.deviceName : this.getChromeVersion());
};
BoxcarConfig.prototype.setDeviceName = function(deviceName) {
    'use strict';
    this.deviceName = deviceName;
    return this;
};
BoxcarConfig.prototype.getOSVersion = function() {
    'use strict';
    return this.osVersion;
};
BoxcarConfig.prototype.setOSVersion = function(osVersion) {
    'use strict';
    this.osVersion = osVersion;
    return;
};
BoxcarConfig.prototype.isDebugEnabled = function() {
    'use strict';
    return this.debugEnabled;
};
BoxcarConfig.prototype.setDebugEnabled = function(debug) {
    'use strict';
    this.debugEnabled = debug;
    return;
};
BoxcarConfig.prototype.console = function() {
    'use strict';
    return this.debugConsole;
};
BoxcarConfig.prototype.setDebugConsole = function(debugConsole) {
    'use strict';
    this.debugConsole = debugConsole;
    return this;
};
BoxcarConfig.prototype.getChromeVersion = function () {
    var raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9\.]+)\s/);
    return raw ? raw[0].trim() : 'unknown browser';
};
BoxcarConfig.prototype.getServiceWorker = function () {
    'use strict';
    return this.serviceWorker;
};
BoxcarConfig.prototype.setServiceWorker = function(serviceWorker) {
    'use strict';
    this.serviceWorker = serviceWorker;
    return;
};

function Payload() {
    'use strict';
    return this;
}
Payload.prototype.getExpiryDateInSecs = function(timeToLiveSecs) {
    'use strict';
    // Date.now() returns unix timestamp in UTC, so we don't need
    // to convert it
    return Math.round(( Date.now() + timeToLiveSecs * 1000 ) / 1000);
};

function BoxcarRegistration(username,deviceName,udid,tags,
        appVersion,osVersion,ttlSecs,senderIdHash) {
    'use strict';
    if (!!username) {
        this.alias = username;
    }
    if (!!deviceName) {
        this.name = deviceName;
    }
    if (!!udid) {
        this.udid = udid;
    }
    if (!!appVersion) {
        this.app_version = appVersion;
    }
    if (!!osVersion) {
        this.os_version = osVersion;
    }
    if (!!senderIdHash) {
        this.sid = senderIdHash;
    }

    this.tags = tags || [];
    this.push = true;
    this.mode = 'production';
    this.expires = Payload.prototype.getExpiryDateInSecs(ttlSecs || 30);
}
BoxcarRegistration.prototype = Payload.prototype;

function BoxcarNotificationTrack(notificationId,ttlSecs) {
    'use strict';
    if (!notificationId) {
        throw new Error("Notification ID not valid");
    }
    this.notificationId = notificationId;
    this.state = 'active';
    this.expires = Payload.prototype.getExpiryDateInSecs(ttlSecs || 30);
}
BoxcarNotificationTrack.prototype = Payload.prototype;

/**
 * Boxcar API environment
 */
var __initBoxcar = function(boxcarConfig) {
    'use strict';

    var signer = (function() {
        var signature = {
            hmacSHA1: function(value, key) {
                return CryptoJS.HmacSHA1(value, key)
                                .toString(CryptoJS.enc.Hex);
            },
            sha1Hash: function(value) {
                return CryptoJS.SHA1(value)
                                .toString(CryptoJS.enc.Hex);
            },
            sign: function(method, host, path, body, secret) {
                // Remove trailing slash
                var normalizedPath = path;
                if (path.endsWith('/')) {
                    normalizedPath = path.substring(0, path.length() - 1);
                }

                var content = '';
                content = content.concat(method.toUpperCase(),'\n',
                                         host.toLowerCase(),'\n',
                                         normalizedPath,'\n',
                                         body);

                return this.hmacSHA1(content, secret);
            }
        };
        return signature;
    }());

    function isRegistered() {
        var registered = localStorage.getItem("registered");
        if ((!!registered) && (registered === "true")) {
            return true;
        }
        return false;
    }

    function registered(enabled) {
        localStorage.setItem("registered", enabled ? "true" : "false");
    }

    function getSubscriptionId(pushSubscription) {
        return pushSubscription.endpoint.split('/').slice(-1)
    }

    function getUDID() {
        // TODO: implement
        return null;
    }

    function status(response) {
        if (response.status >= 200 && response.status < 300) {
            return response;
        } else {
            return Promise.reject(new Error(response.statusText));
        }
    }

    function json(response) {
        return response.json();
    }

    function requestBoxcar(method,resource,bodyObj) {
        var pushHost = boxcarConfig.getPushHost(),
            credentials = boxcarConfig.getBoxcarCredentials(),
            headers = new Headers();

        headers.append('Content-Type', 'application/json');

        var opts = {
            method: method,
            headers: headers,
            mode: 'cors',
            cache: 'no-cache'
        };

        if (!!bodyObj) {
            opts.body = JSON.stringify(bodyObj);
            boxcarConfig.console().debug("resource: "+resource+" - payload: " + opts.body);
        }

        var url = pushHost.getURL(method,resource,
                                  (!!bodyObj ? bodyObj:null),
                                  credentials, signer),
            request = new Request(url);

        return fetch(request,opts).then(status);
    }

    function subscribeGCM() {
        var workerPromise = navigator.serviceWorker.ready;
        return workerPromise.then(function(serviceWorkerRegistration) {
            return serviceWorkerRegistration.pushManager.subscribe({userVisibleOnly: true}).then(
                function(subscription) {
                    return subscription;
                }).catch(function(e) {
                    if (Notification.permission === 'denied') {
                        // The user denied the notification permission which
                        // means we failed to subscribe and the user will need
                        // to manually change the notification permission to
                        // subscribe to push messages
                        return Promise.reject(
                                new Error('Permission for Notifications was denied'));
                    } else {
                        // A problem occurred with the subscription, this can
                        // often be down to an issue or lack of the gcm_sender_id
                        // and / or gcm_user_visible_only
                        return Promise.reject(
                                new Error('Unable to subscribe to push.', e));
                    }
                });
        });
    }

    function registerBoxcar(token,boxcarRegistration) {
        return requestBoxcar('PUT','/api/device_tokens/'+token,boxcarRegistration);
    }

    function unregisterBoxcar(token) {
        return requestBoxcar('DELETE','/api/device_tokens/'+token,null);
    }

    function pingBoxcar(token) {
        return requestBoxcar('GET','/api/ping/'+token,null);
    }

    function trackNotificationBoxcar(token, notificationId) {
        var payload = new BoxcarNotificationTrack(notificationId);
        return requestBoxcar('POST','/api/receive/'+token,payload);
    }

    function tagsBoxcar() {
        return requestBoxcar('GET','/api/tags',null);
    }

    function readToken() {
        // We need the service worker registration to check for a subscription
        return navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
            // Do we already have a push message subscription?
            return serviceWorkerRegistration.pushManager.getSubscription()
                .then( function(subscription) {
                    if (!subscription) {
                        return Promise.reject('Not registered');
                    } else {
                        return subscription;
                    }
            	});
        });
    }

    function checkPushSupported() {
        if (!('serviceWorker' in navigator)) {
            return Promise.reject(
                new Error("Service workers are not supported on this browser"));
        }
        return navigator.serviceWorker.register(boxcarConfig.getServiceWorker())
            .then(function(){
                // Are Notifications supported in the service worker?
                if (!ServiceWorkerRegistration.prototype.hasOwnProperty('showNotification')) {
                    return Promise.reject(
                        new Error('Notifications aren\'t supported.'));
                }
                // Check the current Notification permission.
                // If its denied, it's a permanent block until the
                // user changes the permission
                if (Notification.permission === 'denied') {
                    return Promise.reject(
                        new Error('The user has blocked notifications.'));
                }
                // Check if push messaging is supported
                if (!window.hasOwnProperty('PushManager')) {
                    return Promise.reject(
                        new Error('Push messaging isn\'t supported.'));
                }
                return;
        });
    }

    function register(tags, username, serviceWorkerJs) {
        if (!('serviceWorker' in navigator)) {
            return Promise.reject(
                new Error("Service workers are not supported on this browser"));
        }

        var udid = (!!boxcarConfig.isUDIDEnabled() ? getUDID() : null),
            credentials = boxcarConfig.getBoxcarCredentials(),
            senderIdHash = signer.sha1Hash(credentials.getGCMSenderId()),
            ttlSecs = 30,
            boxcarRegistration = new BoxcarRegistration(username,
                boxcarConfig.getDeviceName(),udid,tags,
                boxcarConfig.getAppVersion(),
                boxcarConfig.getOSVersion(),
                ttlSecs,senderIdHash);

        return navigator.serviceWorker
            .register(boxcarConfig.getServiceWorker())
            .then(checkPushSupported)
            .then(readToken)
            .then(function(subscription) {
                      return subscription;
                  },
                  function() {
                      // not found, register to GCM
                      registered(false);
                      return subscribeGCM();
                  }
            )
            .then(function(subscription) {
                var token = getSubscriptionId(subscription);
                if (!!isRegistered()) {
                    boxcarConfig.console().debug("Already registered. Skip registration.");
                    return Promise.resolve();
                }
                return registerBoxcar(token,boxcarRegistration);
            })
            .then(function(){
                registered(true);
                return;
            })
            .catch(function(err) {
                return Promise.reject(err);
            });
    }

    function unsubscribe() {
        return readToken().then(
            function(pushSubscription){
                var subscriptionId = getSubscriptionId(pushSubscription);
                // We have a subcription, so call unsubscribe on it
                return pushSubscription.unsubscribe().then(function(successful) {
                    registered(false);
                    return unregisterBoxcar(subscriptionId);
                },function(e) {
                    // We failed to unsubscribe, this can lead to
                    // an unusual state, so may be best to remove
                    // the subscription id from your data store and
                    // inform the user that you disabled push
                    return unregisterBoxcar(subscriptionId);
                });
            },
            function(){
                // No subscription object, so set the state
                // to allow the user to subscribe to push
                registered(false);
                return;
        }).catch(function(err) {
            return Promise.reject(err);
        });
    }

    function ping() {
        return readToken().then(
            function(pushSubscription) {
                var subscriptionId = getSubscriptionId(pushSubscription);
                // call ping
                return pingBoxcar(subscriptionId);
        }).catch(function(err) {
            return Promise.reject(err);
        });
    }

    function track(notificationId) {
        return readToken().then(
            function(pushSubscription) {
                var subscriptionId = getSubscriptionId(pushSubscription);
                // call ping
                return trackNotificationBoxcar(subscriptionId, notificationId);
        }).catch(function(err) {
            return Promise.reject(err);
        });
    }

    function tags() {
        return tagsBoxcar()
            .then(json)
            .then(function(response) {
                return response.ok;
        });
    }

    /**
     * Boxcar API
     */
    return {
        /**
         * Returns a Promise which checks if both push and notifications are
         * supported on this browser
         */
        checkSupported : function() {
            return checkPushSupported();
        },
        /**
         * Returns a Promise of registration into Boxcar Push Service,
         * including GCM registration if needed
         */
        register : function(tags, username) {
            return register(tags, username);
        },
        /**
         * Returns a Promise of unregistration to both GCM and Boxcar Push
         * Service
         */
        unregister : function() {
            if (!!isRegistered()) {
                return unsubscribe();
            }
            return Promise.resolve();
        },
        /**
         * Returns a Promise of marking the specified notification ID
         * as 'read' into the Boxcar Push Service
         */
        trackNotification : function(notificationId) {
            return track(notificationId);
        },
        /**
         * Returns a Promise of marking the origin web site as 'visited'
         * into the Boxcar Push Service
         */
        siteVisited : function() {
            return ping();
        },
        /**
         * Tells if push notifications are enabled
         */
        isPushEnabled : function() {
            return isRegistered();
        },
        /**
         * Promise that returns an array for strings representing the tags
         * available for current project at Boxcar Push Service
         */
        getTags : function() {
            return tags();
        }
    };
};
