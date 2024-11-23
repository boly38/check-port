# check-port

This project is inspired from famous repository
- [stdarg/tcp-port-used-check-port](https://github.com/stdarg/tcp-port-used)

# usage to check a port

## setup
(need clone)
````bash
# setup
npm install
````

## run sample

````bash
# launch sample
node samples/basic.js
````

## accept port on localhost:44204

Example to set up a port listener

````bash
npm i http
node.exe -e "require('http').createServer((req, res) => res.end('Hello World')).listen(44204, () => console.log('Listening on port 44204'))"
````