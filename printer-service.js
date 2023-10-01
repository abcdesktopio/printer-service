/*
* Software Name : abcdesktop.io
* Version: 0.2
* SPDX-FileCopyrightText: Copyright (c) 2020-2021 Orange
* SPDX-License-Identifier: GPL-2.0-only
*
* This software is distributed under the GNU General Public License v2.0 only
* see the "license.txt" file for more details.
*
* Author: abcdesktop.io team
* Software description: cloud native desktop service
*/

const WebSocketClient = require('ws');
const chokidar = require('chokidar');
const node_path = require('node:path');
const watchdir = process.env.WATCHDIR || process.env.HOME;
let watcher = null;

function broadcastevent(method, data) {
    const broadcast_tcp_port = process.env.BROADCAST_SERVICE_TCP_PORT || 29784;
    const buri = `ws://${process.env.CONTAINER_IP_ADDR}:${broadcast_tcp_port}`;

    const ws = new WebSocketClient(buri,  {
        host:process.env.CONTAINER_IP_ADDR,
    });

    ws.on('open', () => {
        console.log("Connection to broadcast-service done !");

        try {
            const message = {
                'method': method,
                'data': data
            };
            ws.send(JSON.stringify(message));
	    console.log( message );
		
        } catch (err) { 
            console.error(err);
        } finally {
            ws.close();
            console.log("Connection to broadcast-service closed !");
        }
    });
}

function printer_ready() {
	console.log( 'initial scan ready' );
 	watcher.printerready = true;
}

function printer_addchange( path, stat) {
	console.log( 'printer_addchange' );
	if (watcher.printerready) {
		const jsonres = {};
		console.log( 'path=' + path );
		const urlpath = node_path.basename( path );
		console.log( 'urlpath=' + urlpath );
		jsonres.newfile = true;
		jsonres.date = Date.now().toString();
		jsonres.path = urlpath;
		console.log( jsonres );
		broadcastevent( 'printer.new', jsonres );
	}
}

function printer() {
	console.log( 'watching for files in ' + watchdir );

	// Initialize watcher.
	watcher = chokidar.watch(watchdir, { 
		persistent: true, 
		awaitWriteFinish : true 
	});

	watcher.printerready = false; 
	watcher.home = watchdir;

	// Add event listeners.
	watcher.on('ready', 	printer_ready);
	watcher.on('add',   	printer_addchange );
	watcher.on('change', 	printer_addchange );
}

printer();
