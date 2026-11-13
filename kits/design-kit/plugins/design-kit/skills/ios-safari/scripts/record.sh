#!/bin/zsh
# Record the booted iOS Simulator's screen, then pull still frames out of the video.
#   record.sh start <out-dir>          start recording to <out-dir>/rec.mov
#   record.sh stop  <out-dir> [fps] [crop]
#                                      stop, then write <out-dir>/frames/f000.png... at <fps>
#                                      (default 20), keeping the top <crop> of each frame
#                                      (0.3 = the top 30%, where the header lives; default 1)
#   record.sh sheet <out-dir> <from> <to> [cols]
#                                      tile frames <from>..<to> into <out-dir>/sheet.png to look at
# No ffmpeg needed: frames come from AVFoundation through the Swift scripts beside this file.
set -e
here=${0:A:h}
cmd=$1; out=$2
mkdir -p "$out"
case $cmd in
  start)
    nohup xcrun simctl io booted recordVideo --codec=h264 --force "$out/rec.mov" > "$out/rec.log" 2>&1 &
    echo $! > "$out/rec.pid"
    sleep 1.5; tail -1 "$out/rec.log" ;;
  stop)
    kill -INT "$(cat "$out/rec.pid")"; sleep 2
    rm -rf "$out/frames"; mkdir -p "$out/frames"
    swift "$here/frames.swift" "$out/rec.mov" "$out/frames" "${3:-20}" "${4:-1}" 2>/dev/null
    # File sizes are a cheap motion meter: runs of near-equal sizes are still frames.
    n=$(ls "$out/frames" | wc -l)
    for i in $(seq 0 5 $((n - 1))); do printf "%d:%s " $i $(stat -f %z "$out/frames/$(printf f%03d.png $i)"); done; echo ;;
  sheet)
    swift "$here/sheet.swift" "$out/frames" "$out/sheet.png" "$3" "$4" "${5:-6}" 2>/dev/null
    echo "$out/sheet.png" ;;
  *) echo "usage: record.sh start|stop|sheet <out-dir> ..." >&2; exit 1 ;;
esac
