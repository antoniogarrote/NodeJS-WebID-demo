This is a demo implementation of WebID in node.js

To make it run you need:

- version >0.5 of node.js including the changes that make the additional fields in client certificates available (https://github.com/joyent/node/pull/1286)
- libraptor 2.0 
- to compile the modified version of node bindings for libraptor included in this repository (check the node_raptor dir)
- after compiling raptor bindings, copy the resulting extension and the raptor.js files to the src directory
- start the server with:
    node ./src/server.js


Released under the MIT license <http://www.opensource.org/licenses/MIT>