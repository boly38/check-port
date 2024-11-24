// users: import checkPort from "@boly38/check-port"
import checkPort from "../src/index.js";

const host = 'localhost';
const port = 44204;
checkPort.showTime();
console.log(`check ${host}:${port}...`);
checkPort.waitUntilUsedOnHost(port, host, 500, 4000)
    .then(() => {
        checkPort.showTime();
        console.log(`Port ${host}:${port} is now in use.`);
    }, err => {
        checkPort.showTime();
        console.log('Error:', err.message);
    });