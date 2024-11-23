'use strict';
import assert from "assert";
import checkPort from "../src/index.js";
import net from "net";
import {after, before, describe, it} from "mocha";

let server;

function freePort(cb) {
    if (!server) {
        return cb(new Error('Port not in use'));
    }

    server.close();
    server.unref();
    server = undefined;
    cb();
}

function bindPort(port, cb) {
    if (server) {
        return cb(new Error('Free the server port, first.'));
    }

    server = net.createServer();
    server.listen(port);

    function errEventCb(err) {
        server.close();
        if (cb) {
            rmListeners();
            cb(err);
        }
        server = undefined;
    }

    function listenEventCb() {
        if (cb) {
            rmListeners();
            cb();
        }
    }

    function rmListeners() {
        server.removeListener('error', errEventCb);
        server.removeListener('listening', listenEventCb);
    }

    server.on('error', errEventCb);
    server.on('listening', listenEventCb);
}

describe('check arguments', function () {
    it('should not accept negative port numbers in an obj', function (done) {
        checkPort.check({port: -20, host: '127.0.0.1'})
            .then(function () {
                done(new Error('check unexpectedly succeeded'));
            }, function (err) {
                assert.ok(err && err.message === 'invalid port: -20');
                done();
            });
    });

    it('should not accept negative port numbers', function (done) {
        checkPort.check(-20, '127.0.0.1')
            .then(function () {
                done(new Error('check unexpectedly succeeded'));
            }, function (err) {
                assert.ok(err && err.message === 'invalid port: -20');
                done();
            });
    });

    it('should not accept invalid types for port numbers in an obj', function (done) {
        checkPort.check({port: 'hello', host: '127.0.0.1'})
            .then(function () {
                done(new Error('check unexpectedly succeeded'));
            }, function (err) {
                assert.ok(err && err.message === 'invalid port: \'hello\'');
                done();
            });
    });

    it('should not accept invalid types for port numbers', function (done) {
        checkPort.check('hello', '127.0.0.1')
            .then(function () {
                done(new Error('check unexpectedly succeeded'));
            }, function (err) {
                assert.ok(err && err.message === 'invalid port: \'hello\'');
                done();
            });
    });

    it('should require an argument for a port number in an obj', function (done) {
        checkPort.check({})
            .then(function () {
                done(new Error('check unexpectedly succeeded'));
            }, function (err) {
                assert.ok(err && err.message === 'invalid port: undefined');
                done();
            });
    });

    it('should require an argument for a port number', function (done) {
        checkPort.check()
            .then(function () {
                done(new Error('check unexpectedly succeeded'));
            }, function (err) {
                assert.ok(err && err.message === 'invalid port: undefined');
                done();
            });
    });

    it('should not accept port number > 65535 in an obj', function (done) {
        checkPort.check({port: 65536})
            .then(function () {
                done(new Error('check unexpectedly succeeded'));
            }, function (err) {
                assert.ok(err && err.message === 'invalid port: 65536');
                done();
            });
    });


    it('should not accept port number > 65535', function (done) {
        checkPort.check(65536)
            .then(function () {
                done(new Error('check unexpectedly succeeded'));
            }, function (err) {
                assert.ok(err && err.message === 'invalid port: 65536');
                done();
            });
    });

    it('should not accept port number < 0 in an obj', function (done) {
        checkPort.check({port: -1})
            .then(function () {
                done(new Error('check unexpectedly succeeded'));
            }, function (err) {
                assert.ok(err && err.message === 'invalid port: -1');
                done();
            });
    });

    it('should not accept port number < 0', function (done) {
        checkPort.check(-1)
            .then(function () {
                done(new Error('check unexpectedly succeeded'));
            }, function (err) {
                assert.ok(err && err.message === 'invalid port: -1');
                done();
            });
    });
});

describe('check functionality for unused port', function () {
    before(function (done) {
        bindPort(44202, function (err) {
            done(err);
        });
    });

    it('should return true for a used port with default host value in an obj', function (done) {
        checkPort.check({port: 44202})
            .then(function (inUse) {
                assert.ok(inUse === true);
                done();
            }, function (err) {
                done(err);
            });
    });


    it('should return true for a used port with default host value', function (done) {
        checkPort.check(44202)
            .then(function (inUse) {
                assert.ok(inUse === true);
                done();
            }, function (err) {
                done(err);
            });
    });

    it('should return true for a used port with default host value using arg obj', function (done) {
        checkPort.check({port: 44202})
            .then(function (inUse) {
                assert.ok(inUse === true);
                done();
            }, function (err) {
                done(err);
            });
    });

    it('should return true for a used port with given host value using arg obj', function (done) {
        checkPort.check({port: 44202, host: '127.0.0.1'})
            .then(function (inUse) {
                assert.ok(inUse === true);
                done();
            }, function (err) {
                assert.ok(false);
                done(err);
            });
    });


    it('should return true for a used port with given host value', function (done) {
        checkPort.check(44202, '127.0.0.1')
            .then(function (inUse) {
                assert.ok(inUse === true);
                done();
            }, function (err) {
                assert.ok(false);
                done(err);
            });
    });

    it('should return false for an unused port and default host using arg object', function (done) {
        checkPort.check({port: 44201})
            .then(function (inUse) {
                assert.ok(inUse === false);
                done();
            }, function (err) {
                done(err);
            });
    });


    it('should return false for an unused port and default host', function (done) {
        checkPort.check(44201)
            .then(function (inUse) {
                assert.ok(inUse === false);
                done();
            }, function (err) {
                done(err);
            });
    });

    it('should return false for an unused port and given default host using arg object', function (done) {
        checkPort.check({port: 44201, host: '127.0.0.1'})
            .then(function (inUse) {
                assert.ok(inUse === false);
                done();
            }, function (err) {
                done(err);
            });
    });

    it('should return false for an unused port and given default host', function (done) {
        checkPort.check(44201, '127.0.0.1')
            .then(function (inUse) {
                assert.ok(inUse === false);
                done();
            }, function (err) {
                done(err);
            });
    });

    after(function (cb) {
        freePort(function (err) {
            cb(err);
        });
    });
});


describe('waitUntilUsedOnHost', function () {
    this.timeout(5000);
    this.slow(5000);

    before(function () {
        setTimeout(function () {
            bindPort(44204);
        }, 2000);
    });

    it('should wait until the port is listening using an arg object', function (done) {
        checkPort.waitUntilUsedOnHost({port: 44204, host: '127.0.0.1', retryTimeMs: 500, timeOutMs: 4000})
            .then(function () {
                done();
            }, function (err) {
                done(err);
            });
    });

    it('should wait until the port is listening', function (done) {
        checkPort.waitUntilUsedOnHost(44204, '127.0.0.1', 500, 4000)
            .then(function () {
                done();
            }, function (err) {
                done(err);
            });
    });

    it('should reject promise when given an invalid port using an arg object', function (done) {
        checkPort.waitUntilUsedOnHost({port: 'hello', host: '127.0.0.1', retryTimeMs: 500, timeOutMs: 2000})
            .then(function () {
                done(new Error('waitUntil used unexpectedly successful.'));
            }, function (err) {
                if (err.message === 'invalid port: \'hello\'') {
                    done();
                } else {
                    done(err);
                }
            });
    });

    it('should reject promise when given an invalid port', function (done) {
        checkPort.waitUntilUsedOnHost('hello', '127.0.0.1', 500, 2000)
            .then(function () {
                done(new Error('waitUntil used unexpectedly successful.'));
            }, function (err) {
                if (err.message === 'invalid port: \'hello\'') {
                    done();
                } else {
                    done(err);
                }
            });
    });

    it('should timeout when no port is listening using an arg obj', function (done) {
        checkPort.waitUntilUsedOnHost({port: 44205, host: '127.0.0.1', retryTimeMs: 500, tmieOutMs: 2000})
            .then(function () {
                done(new Error('waitUntil used unexpectedly successful.'));
            }, function (err) {
                if (err.message === 'timeout') {
                    done();
                } else {
                    done(err);
                }
            });
    });


    it('should timeout when no port is listening', function (done) {
        checkPort.waitUntilUsedOnHost(44205, '127.0.0.1', 500, 2000)
            .then(function () {
                done(new Error('waitUntil used unexpectedly successful.'));
            }, function (err) {
                if (err.message === 'timeout') {
                    done();
                } else {
                    done(err);
                }
            });
    });

    after(function (cb) {
        freePort(function (err) {
            cb(err);
        });
    });
});

describe('waitForStatus', function () {
    this.timeout(5000);
    this.slow(5000);

    before(function () {
        setTimeout(function () {
            bindPort(44204);
        }, 2000);
    });

    it('should wait until the port is listening using arg obj', function (done) {
        checkPort.waitForStatus({port: 44204, host: '127.0.0.1', inUse: true, retryTimeMs: 500, timeOutMs: 4000})
            .then(function () {
                done();
            }, function (err) {
                done(err);
            });
    });

    it('should wait until the port is listening', function (done) {
        checkPort.waitForStatus(44204, '127.0.0.1', true, 500, 4000)
            .then(function () {
                done();
            }, function (err) {
                done(err);
            });
    });

    it('should reject promise when given an invalid port using arg object', function (done) {
        checkPort.waitForStatus({port: 'hello', host: '127.0.0.1', inUse: false, retryTimeMs: 500, timeOutMs: 2000})
            .then(function () {
                done(new Error('waitUntil used unexpectedly successful.'));
            }, function (err) {
                if (err.message === 'invalid port: \'hello\'') {
                    done();
                } else {
                    done(err);
                }
            });
    });

    it('should reject promise when given an invalid port', function (done) {
        checkPort.waitForStatus('hello', '127.0.0.1', false, 500, 2000)
            .then(function () {
                done(new Error('waitUntil used unexpectedly successful.'));
            }, function (err) {
                if (err.message === 'invalid port: \'hello\'') {
                    done();
                } else {
                    done(err);
                }
            });
    });

    it('should timeout when no port is listening using arg obj', function (done) {
        checkPort.waitUntilUsed({port: 44205, host: '127.0.0.1', inUse: true, retryTimeMs: 500, timeOutMs: 2000})
            .then(function () {
                done(new Error('waitUntil used unexpectedly successful.'));
            }, function (err) {
                if (err.message === 'timeout') {
                    done();
                } else {
                    done(err);
                }
            });
    });

    it('should timeout when no port is listening', function (done) {
        checkPort.waitUntilUsed(44205, 500, 2000)
            .then(function () {
                done(new Error('waitUntil used unexpectedly successful.'));
            }, function (err) {
                if (err.message === 'timeout') {
                    done();
                } else {
                    done(err);
                }
            });
    });

    after(function (cb) {
        freePort(function (err) {
            cb(err);
        });
    });
});

