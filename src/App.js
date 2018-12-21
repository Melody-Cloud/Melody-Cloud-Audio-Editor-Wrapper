import React, {Component} from 'react';
import './App.css';
import $ from 'jquery';

class App extends Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        let WaveformPlaylist = require('waveform-playlist');

        let playlist = WaveformPlaylist.init({
            samplesPerPixel: 3000,
            waveHeight: 100,
            container: document.getElementById("playlist"),
            state: 'cursor',
            colors: {
                waveOutlineColor: '#E0EFF1',
                timeColor: 'grey',
                fadeColor: 'black'
            },
            timescale: true,
            controls: {
                show: true, //whether or not to include the track controls
                width: 200 //width of controls in pixels
            },
            seekStyle: 'line',
            zoomLevels: [500, 1000, 3000, 5000]
        });

        playlist.load([]).then(function () {
            //initialize the WAV exporter.
            playlist.initExporter();
        });


        /*
         * This script is provided to give an example how the playlist can be controlled using the event emitter.
         * This enables projects to create/control the useability of the project.
        */
        let ee = playlist.getEventEmitter();
        let $container = $("body");
        let $timeFormat = $container.find('.time-format');
        let $audioStart = $container.find('.audio-start');
        let $audioEnd = $container.find('.audio-end');
        let $time = $container.find('.audio-pos');

        let format = "hh:mm:ss.uuu";
        let startTime = 0;
        let endTime = 0;
        let audioPos = 0;
        let downloadUrl = undefined;
        let isLooping = false;
        let playoutPromises;

        function toggleActive(node) {
            let active = node.parentNode.querySelectorAll('.active');
            let i = 0, len = active.length;

            for (; i < len; i++) {
                active[i].classList.remove('active');
            }

            node.classList.toggle('active');
        }

        function cueFormatters(format) {

            function clockFormat(seconds, decimals) {
                let hours,
                    minutes,
                    secs,
                    result;

                hours = parseInt(seconds / 3600, 10) % 24;
                minutes = parseInt(seconds / 60, 10) % 60;
                secs = seconds % 60;
                secs = secs.toFixed(decimals);

                result = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (secs < 10 ? "0" + secs : secs);

                return result;
            }

            let formats = {
                "seconds": function (seconds) {
                    return seconds.toFixed(0);
                },
                "thousandths": function (seconds) {
                    return seconds.toFixed(3);
                },
                "hh:mm:ss": function (seconds) {
                    return clockFormat(seconds, 0);
                },
                "hh:mm:ss.u": function (seconds) {
                    return clockFormat(seconds, 1);
                },
                "hh:mm:ss.uu": function (seconds) {
                    return clockFormat(seconds, 2);
                },
                "hh:mm:ss.uuu": function (seconds) {
                    return clockFormat(seconds, 3);
                }
            };

            return formats[format];
        }

        function updateSelect(start, end) {
            if (start < end) {
                $('.btn-trim-audio').removeClass('disabled');
                $('.btn-loop').removeClass('disabled');
            }
            else {
                $('.btn-trim-audio').addClass('disabled');
                $('.btn-loop').addClass('disabled');
            }

            $audioStart.val(cueFormatters(format)(start));
            $audioEnd.val(cueFormatters(format)(end));

            startTime = start;
            endTime = end;
        }

        function updateTime(time) {
            $time.html(cueFormatters(format)(time));

            audioPos = time;
        }

        updateSelect(startTime, endTime);
        updateTime(audioPos);

        $container.on("click", ".btn-annotations-download", function () {
            ee.emit("annotationsrequest");
        });

        $container.on("click", ".btn-loop", function () {
            isLooping = true;
            playoutPromises = playlist.play(startTime, endTime);
        });

        $container.on("click", ".btn-play", function () {
            ee.emit("play");
        });

        $container.on("click", ".btn-pause", function () {
            isLooping = false;
            ee.emit("pause");
        });

        $container.on("click", ".btn-stop", function () {
            isLooping = false;
            ee.emit("stop");
        });

        $container.on("click", ".btn-rewind", function () {
            isLooping = false;
            ee.emit("rewind");
        });

        $container.on("click", ".btn-fast-forward", function () {
            isLooping = false;
            ee.emit("fastforward");
        });

        $container.on("click", ".btn-clear", function () {
            isLooping = false;
            ee.emit("clear");
        });

        $container.on("click", ".btn-record", function () {
            ee.emit("record");
        });

        //track interaction states
        $container.on("click", ".btn-cursor", function () {
            ee.emit("statechange", "cursor");
            toggleActive(this);
        });

        $container.on("click", ".btn-select", function () {
            ee.emit("statechange", "select");
            toggleActive(this);
        });

        $container.on("click", ".btn-shift", function () {
            ee.emit("statechange", "shift");
            toggleActive(this);
        });

        $container.on("click", ".btn-fadein", function () {
            ee.emit("statechange", "fadein");
            toggleActive(this);
        });

        $container.on("click", ".btn-fadeout", function () {
            ee.emit("statechange", "fadeout");
            toggleActive(this);
        });

        //fade types
        $container.on("click", ".btn-logarithmic", function () {
            ee.emit("fadetype", "logarithmic");
            toggleActive(this);
        });

        $container.on("click", ".btn-linear", function () {
            ee.emit("fadetype", "linear");
            toggleActive(this);
        });

        $container.on("click", ".btn-scurve", function () {
            ee.emit("fadetype", "sCurve");
            toggleActive(this);
        });

        $container.on("click", ".btn-exponential", function () {
            ee.emit("fadetype", "exponential");
            toggleActive(this);
        });

        //zoom buttons
        $container.on("click", ".btn-zoom-in", function () {
            ee.emit("zoomin");
        });

        $container.on("click", ".btn-zoom-out", function () {
            ee.emit("zoomout");
        });

        $container.on("click", ".btn-trim-audio", function () {
            ee.emit("trim");
        });

        $container.on("click", ".btn-info", function () {
            console.log(playlist.getInfo());
        });

        $container.on("click", ".btn-download", function () {
            ee.emit('startaudiorendering', 'wav');
        });

        $container.on("click", ".btn-seektotime", function () {
            let time = parseInt(document.getElementById("seektime").value, 10);
            ee.emit("select", time, time);
        });

        $container.on("change", ".select-seek-style", function (node) {
            playlist.setSeekStyle(node.target.value);
        });

        //track drop
        $container.on("dragenter", ".track-drop", function (e) {
            e.preventDefault();
            e.target.classList.add("drag-enter");
        });

        $container.on("dragover", ".track-drop", function (e) {
            e.preventDefault();
        });

        $container.on("dragleave", ".track-drop", function (e) {
            e.preventDefault();
            e.target.classList.remove("drag-enter");
        });

        $container.on("drop", ".track-drop", function (e) {
            e.preventDefault();
            e.target.classList.remove("drag-enter");

            let dropEvent = e.originalEvent;

            for (let i = 0; i < dropEvent.dataTransfer.files.length; i++) {
                ee.emit("newtrack", dropEvent.dataTransfer.files[i]);
            }
        });

        $container.on("change", ".time-format", function (e) {
            format = $timeFormat.val();
            ee.emit("durationformat", format);

            updateSelect(startTime, endTime);
            updateTime(audioPos);
        });

        $container.on("input change", ".master-gain", function (e) {
            ee.emit("mastervolumechange", e.target.value);
        });

        $container.on("change", ".continuous-play", function (e) {
            ee.emit("continuousplay", $(e.target).is(':checked'));
        });

        $container.on("change", ".link-endpoints", function (e) {
            ee.emit("linkendpoints", $(e.target).is(':checked'));
        });

        $container.on("change", ".automatic-scroll", function (e) {
            ee.emit("automaticscroll", $(e.target).is(':checked'));
        });

        function displaySoundStatus(status) {
            $(".sound-status").html(status);
        }

        function displayLoadingData(data) {
            let info = $("<div/>").append(data);
            $(".loading-data").append(info);
        }

        function displayDownloadLink(link) {
            let dateString = (new Date()).toISOString();
            let $link = $("<a/>", {
                'href': link,
                'download': 'waveformplaylist' + dateString + '.wav',
                'text': 'Download mix ' + dateString,
                'class': 'btn btn-small btn-download-link'
            });

            $('.btn-download-link').remove();
            $('.btn-download').after($link);
        }


        /*
        * Code below receives updates from the playlist.
        */
        ee.on("select", updateSelect);

        ee.on("timeupdate", updateTime);

        ee.on("mute", function (track) {
            displaySoundStatus("Mute button pressed for " + track.name);
        });

        ee.on("solo", function (track) {
            displaySoundStatus("Solo button pressed for " + track.name);
        });

        ee.on("volumechange", function (volume, track) {
            displaySoundStatus(track.name + " now has volume " + volume + ".");
        });

        ee.on("mastervolumechange", function (volume) {
            displaySoundStatus("Master volume now has volume " + volume + ".");
        });


        let audioStates = ["uninitialized", "loading", "decoding", "finished"];

        ee.on("audiorequeststatechange", function (state, src) {
            let name = src;

            if (src instanceof File) {
                name = src.name;
            }

            displayLoadingData("Track " + name + " is in state " + audioStates[state]);
        });

        ee.on("loadprogress", function (percent, src) {
            let name = src;

            if (src instanceof File) {
                name = src.name;
            }

            displayLoadingData("Track " + name + " has loaded " + percent + "%");
        });

        ee.on("audiosourcesloaded", function () {
            displayLoadingData("Tracks have all finished decoding.");
        });

        ee.on("audiosourcesrendered", function () {
            displayLoadingData("Tracks have been rendered");
        });

        ee.on('audiorenderingfinished', function (type, data) {
            if (type == 'wav') {
                if (downloadUrl) {
                    window.URL.revokeObjectURL(downloadUrl);
                }

                downloadUrl = window.URL.createObjectURL(data);
                displayDownloadLink(downloadUrl);
            }
        });

        ee.on('finished', function () {
            console.log("The cursor has reached the end of the selection !");

            if (isLooping) {
                playoutPromises.then(function () {
                    playoutPromises = playlist.play(startTime, endTime);
                });
            }
        });
    }

    render() {
        return (
            <div className="App">
                <div className="container">
                    <div className="wrapper">
                        <article className="post">
                            <header className="post-header">
                                <h1 className="post-title">Audio Editor</h1>
                            </header>
                            <div className="post-content">
                                <div id="top-bar" className="playlist-top-bar">
                                    <div className="playlist-toolbar">

                                        <div className="group-spacing btn-group">
                                            <span className="btn-pause btn btn-warning">
                                                <i className="fa fa-pause"/>
                                            </span>
                                            <span className="btn-play btn btn-success">
                                                <i className="fa fa-play"/>
                                            </span>
                                            <span className="btn-stop btn btn-danger">
                                                <i className="fa fa-stop"/>
                                            </span>
                                            <span className="btn-rewind btn btn-success">
                                                <i className="fa fa-fast-backward"/>
                                            </span>
                                            <span className="btn-fast-forward btn btn-success">
                                                <i className="fa fa-fast-forward"/>
                                            </span>
                                        </div>

                                        <div className="group-spacing btn-group">
                                            <span title="zoom in" className="btn-zoom-in btn btn-default">
                                                <i className="fa fa-search-plus"/>
                                            </span>
                                            <span title="zoom out" className="btn-zoom-out btn btn-default">
                                                <i className="fa fa-search-minus"/>
                                            </span>
                                        </div>

                                        <div className="group-spacing btn-group btn-playlist-state-group">
                                            <span className="btn-cursor btn btn-default active" title="select cursor">
                                                <i className="fa fa-headphones"/>
                                            </span>
                                            <span className="btn-select btn btn-default"
                                                  title="select audio region">
                                                <i className="fa fa-italic"/>
                                            </span>
                                            <span className="btn-shift btn btn-default" title="shift audio in time">
                                                <i className="fa fa-arrows-h"/>
                                            </span>
                                            <span className="btn-fadein btn btn-default" title="set audio fade in">
                                                <i className="fa fa-long-arrow-left"/>
                                            </span>
                                            <span className="btn-fadeout btn btn-default"
                                                  title="set audio fade out">
                                                <i className="fa fa-long-arrow-right"/>
                                            </span>
                                        </div>


                                        <div className="group-spacing btn-group btn-fade-state-group">
                                                <span
                                                    className="btn btn-default btn-logarithmic active">logarithmic</span>
                                            <span className="btn btn-default btn-linear">linear</span>
                                            <span className="btn btn-default btn-exponential">exponential</span>
                                            <span className="btn btn-default btn-scurve">s-curve</span>
                                        </div>

                                        <div className="group-spacing btn-group btn-select-state-group">
                                            <span className="btn-loop btn btn-success disabled" title="loop a selected segment of audio">
                                              <i className="fa fa-repeat"/>
                                            </span>
                                            <span title="keep only the selected audio region for a track"
                                                  className="btn-trim-audio btn btn-primary disabled">Trim</span>
                                        </div>

                                        <div className="group-spacing btn-group">
                                            <span title="Prints playlist info to console"
                                                  className="btn btn-info">Print</span>
                                            <span title="Clear the playlist's tracks"
                                                  className="btn btn-clear btn-danger">Clear</span>
                                        </div>

                                        <div className="group-spacing btn-group">
                                            <span title="Download the current work as Wav file" className="btn btn-download btn-primary">
                                              <i className="fa fa-download"/>
                                            </span>
                                        </div>

                                    </div>
                                </div>
                                <div id="playlist"/>
                                <div className="playlist-bottom-bar">
                                    <form className="form-inline mb">
                                        <select className="time-format form-control mr">
                                            <option value="seconds">seconds</option>
                                            <option value="thousandths">thousandths</option>
                                            <option value="hh:mm:ss">hh:mm:ss</option>
                                            <option value="hh:mm:ss.u">hh:mm:ss + tenths</option>
                                            <option value="hh:mm:ss.uu">hh:mm:ss + hundredths</option>
                                            <option value="hh:mm:ss.uuu" selected="selected">hh:mm:ss +
                                                milliseconds
                                            </option>
                                        </select>
                                        <input type="text" className="audio-start input-small form-control"/>
                                        <input type="text" className="audio-end form-control"/>
                                        <label className="audio-pos ml-audio-pos">00:00:00.0</label>
                                    </form>

                                    <form className="form-inline mb">
                                        <div className="form-group">
                                            <label htmlFor="master-gain">Master Volume</label>
                                            <input type="range" min="0" max="100" value="100"
                                                   className="master-gain form-control" id="master-gain"/>
                                        </div>
                                        <div className="checkbox">
                                            <label>
                                                <input type="checkbox" className="automatic-scroll"/> Automatic
                                                Scroll
                                            </label>
                                        </div>
                                    </form>

                                    <form className="form-inline mb">
                                        <div className="control-group">
                                            <label htmlFor="time">Seek to time: </label>
                                            <input type="number" className="form-control ml-big" value="14" id="seektime"/>
                                            <span className="btn btn-primary btn-seektotime ml">Seek !</span>
                                        </div>
                                    </form>
                                    <div className="sound-status"/>
                                    <div className="track-drop"/>
                                    <div className="loading-data"/>
                                </div>

                            </div>
                        </article>
                    </div>
                </div>
            </div>
        );
    }
}

export default App;
