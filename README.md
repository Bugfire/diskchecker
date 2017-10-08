# diskchecker

## Purpose

I want to check my sdcard works fine.

## Details

Fill disk with random data, and read to check written data validity.

## Usage

./diskchecker.js <target dir>

```
$ ./diskchecker.js /Volumes/Untitled/tmp
15:40:11: Diskchecker start
15:40:11: Checking write...
  58880MB
16:17:37: Checking read...
  58880MB
16:35:21: Result:
  Size: 58880MB
  Read: 55MB/s
  Write: 26MB/s
```
