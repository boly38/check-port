import is from "is2"
import util from "util"
import net from "net"
import debugLib from "debug"

const debug = debugLib('check-port');

// Global Values
const TIMEOUT = 2000;
const RETRY_TIME = 250;

const makeOptionsObj = (port, host, inUse, retryTimeMs, timeOutMs) => {
    return {port, host, inUse, retryTimeMs, timeOutMs}
};

export default class checkPort {

    static check(port, host) {
        return new Promise((resolve, reject) => {
            let inUse = true;
            let client;
            let opts;
            if (!is.obj(port)) {
                opts = makeOptionsObj(port, host);
            } else {
                opts = port;
            }

            if (!is.port(opts.port)) {
                debug('Error invalid port: ' + util.inspect(opts.port));
                reject(new Error('invalid port: ' + util.inspect(opts.port)));
                return;
            }

            if (is.nullOrUndefined(opts.host)) {
                debug('set host address to default 127.0.0.1');
                opts.host = '127.0.0.1';
            }

            if (!is.positiveInt(opts.timeOutMs)) {
                opts.timeOutMs = null;
            }

            function cleanUp() {
                if (client) {
                    client.removeAllListeners('connect');
                    client.removeAllListeners('error');
                    client.end();
                    client.destroy();
                    client.unref();
                }
                //debug('listeners removed from client socket');
            }

            function onConnectCb() {
                //debug('check - promise resolved - in use');
                cleanUp();
                resolve(inUse);
            }

            function onErrorCb(err) {
                if (err.code !== 'ECONNREFUSED') {
                    cleanUp();
                    reject(err);
                } else {
                    //debug('ECONNREFUSED');
                    inUse = false;
                    cleanUp();
                    resolve(inUse);
                }
            }

            client = new net.Socket();
            if (is.positiveInt(opts.timeOutMs)) {
                client.setTimeout(opts.timeOutMs);
                client.on('timeout', () => {
                    debug('check timeout');
                    inUse = false;
                    cleanUp();
                    resolve(inUse);
                });
            }
            client.once('connect', onConnectCb);
            client.once('error', onErrorCb);
            client.connect({port: opts.port, host: opts.host}, () => {
            });
        });
    }

    static waitForStatus(port, host, inUse, retryTimeMs, timeOutMs) {
        const lib = this;
        return new Promise((resolve, reject) => {
            let timeoutId;
            let timedout = false;
            let retryId;

            // the first argument may be an object, if it is not, make an object
            let opts;
            if (is.obj(port)) {
                opts = port;
            } else {
                opts = makeOptionsObj(port, host, inUse, retryTimeMs, timeOutMs);
            }

            if (!is.bool(opts.inUse)) {
                reject(new Error('inUse must be a boolean'));
                return;
            }
            if (!is.positiveInt(opts.retryTimeMs)) {
                opts.retryTimeMs = RETRY_TIME;
                debug('set retryTime to default ' + RETRY_TIME + 'ms');
            }
            if (!is.positiveInt(opts.timeOutMs)) {
                opts.timeOutMs = TIMEOUT;
                debug('set timeOutMs to default ' + TIMEOUT + 'ms');
            }

            function cleanUp() {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                if (retryId) {
                    clearTimeout(retryId);
                }
            }

            function timeoutFunc() {
                timedout = true;
                reject(new Error('timeout'));
                cleanUp();
            }

            timeoutId = setTimeout(timeoutFunc, opts.timeOutMs);

            function doCheck() {
                lib.check(opts)// .port, opts.host)
                    .then(function (inUse) {
                        if (timedout) {
                            return;
                        }
                        //debug('doCheck inUse: '+inUse);
                        //debug('doCheck opts.inUse: '+opts.inUse);
                        if (inUse === opts.inUse) {
                            cleanUp();
                            resolve();
                        } else {
                            retryId = setTimeout(function () {
                                doCheck();
                            }, opts.retryTimeMs);
                        }
                    }, function (err) {
                        if (timedout) {
                            return;
                        }
                        cleanUp();
                        reject(err);
                    });
            }

            doCheck();
        });
    }

    /**
     * Creates a promise and fulfills it only when the socket is used.
     * Will retry on an interval specified in retryTimeMs.
     * Note: you have to be super-user to correctly test system ports (0-1023).
     * @return {Object} A deferred promise from the q library.
     * @param {Number|Object} port a valid TCP port number. If an object, must contain all the parameters as properties.
     * @param port
     * @param host
     * @param retryTimeMs
     * @param {Number} [retryTimeMs] the retry interval in milliseconds - default is is 500ms
     * @param {Number} [timeOutMs] the amount of time to wait until port is free
     * @param timeOutMs
     * @returns {Promise<unknown>}
     */
    static waitUntilUsedOnHost = (port, host, retryTimeMs, timeOutMs) => {
        // the first argument may be an object, if it is not, make an object
        let opts;
        if (is.obj(port)) {
            opts = port;
            opts.inUse = true;
        } else {
            opts = makeOptionsObj(port, host, true, retryTimeMs, timeOutMs);
        }
        return this.waitForStatus(opts);
    }

    /**
     * For compatibility to previous version of module which did not have support
     * for host addresses. This function works only for localhost.
     * @param {Number} port a valid TCP port number. If an Object, must contain all the parameters as properties.
     * @param {Number} [retryTimeMs] the retry interval in milliseconds - defaultis is 500ms
     * @param {Number} [timeOutMs] the amount of time to wait until port is free
     * @return {Object} A deferred promise from the q library.
     *
     * Example usage:
     *
     * var tcpPortUsed = require('tcp-port-used');
     * tcpPortUsed.waitUntilUsed(44204, 500, 4000)
     * .then(function() {
     *     console.log('Port 44204 is now in use.');
     * }, function(err) {
     *     console.log('Error: ', error.message);
     * });
     */
    static waitUntilUsed = (port, retryTimeMs = RETRY_TIME, timeOutMs = TIMEOUT) => {
        // the first argument may be an object, if it is not, make an object
        let opts;
        if (is.obj(port)) {
            opts = port;
            opts.host = '127.0.0.1';
            opts.inUse = true;
        } else {
            opts = makeOptionsObj(port, '127.0.0.1', true, retryTimeMs, timeOutMs);
        }

        return this.waitUntilUsedOnHost(opts);
    }

    static showTime = (instant = new Date()) => console.log(
        `${instant.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })}:${instant.getMilliseconds()}`
    );

}
