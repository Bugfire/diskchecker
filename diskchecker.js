#!/usr/bin/env node

'use strict';

const fs = require('fs');

const BUFFER_SIZE = 256*1024*1024;
    
if (process.argv.length != 3) {
    console.error('usage: ' + require('path').basename(process.argv[1]) + ' [file]');
    process.exit(1);
}

const dirname = process.argv[2];
let cleanDir = false;

try {
    fs.statSync(dirname);
    console.error('File or directory exists: ' + dirname);
    terminate();
} catch (err) {
}

try {
    fs.mkdirSync(dirname);
    cleanDir = true;
} catch (err) {
    console.error('MkdirError: ' + err.toString());
    terminate();
}

process.on('SIGINT', () => {
    terminate();
});

log('Diskchecker start');

const result = {};

check_write();
check_read();
clean();
write_result();

function log(msg)
{
    process.stdout.write(new Date().toLocaleTimeString() + ': ' + msg + '\n');
}

function check_write()
{
    log('Checking write...');

    const start_time = new Date().getTime();
    const buffer = Buffer.alloc(BUFFER_SIZE, 0, 'binary');
    let count = 0;

    process.stdout.write('  0MB ');

    try {
        try {
            while (true) {
                set_buffer(buffer, count);
                const filename = dirname + '/' + count;
                fs.writeFileSync(filename, buffer, { flag : 'wx+' });
                count++;
                process.stdout.write('\r  ' + ((count * BUFFER_SIZE / (1024*1024)) | 0) + 'MB ');
            }
        } catch (err) {
            if (err.code != 'ENOSPC') {
                throw err;
            }
        }
        process.stdout.write('\n');
        const diff = (new Date().getTime() - start_time) / 1000.0;
        result.size = BUFFER_SIZE * count;
        result.writeSpeed = result.size / diff;
        result.count = count;
    } catch (err) {
        process.stdout.write('\n');
        console.error('WriteError: ' + err.toString());
        terminate();
    }
}

function check_read()
{
    log('Checking read...');

    process.stdout.write('  0MB ');

    try {
        const start_time = new Date().getTime();
        for (let count = 0; count < result.count; count++) {
            const filename = dirname + '/' + count;
            const buffer = fs.readFileSync(filename, { flag : 'rs+' });
            if (buffer.length != BUFFER_SIZE || !check_buffer(buffer, count)) {
                process.stdout.write('\n');
                console.error('ReadError: Invalid file ' + filename);
                terminate();
            }
            process.stdout.write('\r  ' + (((count + 1) * BUFFER_SIZE / (1024*1024)) | 0) + 'MB ');
        }
        process.stdout.write('\n');
        const diff = (new Date().getTime() - start_time) / 1000.0;
        result.readSpeed = result.size / diff;
    } catch (err) {
        process.stdout.write('\n');
        console.error('ReadError: ' + err.toString());
        terminate();
    }
}

function write_result()
{
    log('Result: ');
    console.log('  Size: ' + ((result.size / (1024*1024)) | 0) + 'MB');
    console.log('  Read: ' + ((result.readSpeed / (1024*1024)) | 0) + 'MB/s');
    console.log('  Write: ' + ((result.writeSpeed / (1024*1024)) | 0) + 'MB/s');
}


function set_buffer(buffer, offset)
{
    // xorshift32
    let x = 521288629 ^ offset;
    for (let i = 0; i < buffer.length; i++) {
        x = x ^ (x << 13);
        x = x ^ (x >> 17);
        x = x ^ (x << 15);
        let t = x & 0xff;
        buffer[i] = t;
    }
}

function check_buffer(buffer, offset)
{
    // xorshift32
    let x = 521288629 ^ offset;
    for (let i = 0; i < buffer.length; i++) {
        x = x ^ (x << 13);
        x = x ^ (x >> 17);
        x = x ^ (x << 15);
        let t = x & 0xff;
        if (buffer[i] != t) {
            return false;
        }
    }
    return true;
}

function clean()
{
    if (cleanDir == false) {
        return;
    }
    cleanDir = false;

    const files = fs.readdirSync(dirname);
    files.forEach(file => {
        fs.unlinkSync(dirname + '/' + file);
    });
    fs.rmdirSync(dirname);
}

function terminate()
{
    console.log('terminate');
    clean();
    process.exit(1);
    console.log('???');
}
