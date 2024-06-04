/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

/*global dashjs*/

let TestRule;
const TEST_STATE_ONE_BITRATE = 0;
const TEST_STATE_STARTUP = 1;
const TEST_STATE_STEADY = 2;

const horizon = 5;
const bufferMaxSize = 25;
const videoChunkLength = 2;
const rebufferPenalty = 1.85;
const MTU = 1166;
const setBitrates = [1,3,4,5,6];

function TestRuleClass() {

    const context = this.context;

    const factory = dashjs.FactoryMaker;
    const SwitchRequest = factory.getClassFactoryByName('SwitchRequest');
    const DashMetrics = factory.getSingletonFactoryByName('DashMetrics');
    const dashMetrics = DashMetrics(context).getInstance();

    const Debug = factory.getSingletonFactoryByName('Debug');

    let instance,
        logger,
        TestStateDict,
        test;

    function setup() {
        logger = Debug(context).getInstance().getLogger(instance);
        resetInitialSettings();
        updateMetrics();
    }

    function getInitialTestState(rulesContext) {
        const initialState = {};
        const mediaInfo = rulesContext.getMediaInfo();
        const bitrates = mediaInfo.bitrateList.map(b => b.bandwidth);
        // const bitrates = [1,3,4,5,6];

        if (bitrates.length == 1) {
            initialState.state = TEST_STATE_ONE_BITRATE;
        }
        else {
            initialState.state = TEST_STATE_STARTUP;
        }
        initialState.bitrates = bitrates;
        initialState.lastQuality = 0;
        initialState.chunkBitrateSequenceOptions = [];
        getChunkBitrateSequenceOptions(initialState, horizon);
        // for (let i = 0; i < initialState.chunkBitrateSequenceOptions.length; i++) {
        //     console.log("Options:%d|%d|%d|%d|%d", 
        //                 initialState.chunkBitrateSequenceOptions[i][0], 
        //                 initialState.chunkBitrateSequenceOptions[i][1], 
        //                 initialState.chunkBitrateSequenceOptions[i][2], 
        //                 initialState.chunkBitrateSequenceOptions[i][3], 
        //                 initialState.chunkBitrateSequenceOptions[i][4]);
        // }
        return initialState;
    }

    function getTestState(rulesContext) {
        const mediaType = rulesContext.getMediaType();
        let TestState = TestStateDict[mediaType];
        if (!TestState) {
            TestState = getInitialTestState(rulesContext);
            TestStateDict[mediaType] = TestState;
        }
        return TestState;
    }

    function updateMetrics() {
        fetch('https://time.akamai.com')
            .then(function(response) {
                return response.text();
            })
            .then(function(data) {
                test = data;
                console.log('Modified request successful:', data);
            })
        setTimeout(updateMetrics, 1000);
    }

    function getChunkBitrateSequenceOptions(TestState, horizon, currentArray = []) {
        if (currentArray.length === horizon) {
            TestState.chunkBitrateSequenceOptions.push([...currentArray]);
            return;
        }

        for (let i = 0; i < setBitrates.length; i++) {
            const newArray = [...currentArray, setBitrates[i]];
            getChunkBitrateSequenceOptions(TestState, horizon, newArray);
        }
    }

    function getMaxIndex(rulesContext) {
        // updateMetrics();
        console.log('11111', test);
        const switchRequest = SwitchRequest(context).create();

        if (!rulesContext || !rulesContext.hasOwnProperty('getMediaInfo') || !rulesContext.hasOwnProperty('getMediaType') ||
            !rulesContext.hasOwnProperty('getScheduleController') || !rulesContext.hasOwnProperty('getStreamInfo') ||
            !rulesContext.hasOwnProperty('getAbrController') || !rulesContext.hasOwnProperty('useBufferOccupancyABR')) {
            return switchRequest;
        }
        const mediaInfo = rulesContext.getMediaInfo();
        const mediaType = rulesContext.getMediaType();
        const scheduleController = rulesContext.getScheduleController();
        const streamInfo = rulesContext.getStreamInfo();
        const abrController = rulesContext.getAbrController();
        const throughputHistory = abrController.getThroughputHistory();
        const streamId = streamInfo ? streamInfo.id : null;
        const isDynamic = streamInfo && streamInfo.manifestInfo && streamInfo.manifestInfo.isDynamic;
        switchRequest.reason = switchRequest.reason || {};

        scheduleController.setTimeToLoadDelay(0);
        
        const TestState = getTestState(rulesContext);
        if (TestState.state === TEST_STATE_ONE_BITRATE) {
            return switchRequest;
        }

        const bufferLevel = dashMetrics.getCurrentBufferLevel(mediaType);
        const throughput = throughputHistory.getAverageThroughput(mediaType, isDynamic);
        const safeThroughput = throughputHistory.getSafeAverageThroughput(mediaType, isDynamic);
        const latency = throughputHistory.getAverageLatency(mediaType);
        let quality;

        switchRequest.reason.state = TestState.state;
        switchRequest.reason.throughput = throughput;
        switchRequest.reason.latency = latency;
        let bitrateSequenceSelected = [],
            QoE,
            maxQoE,
            rebuffer,
            bitrateSum,
            smoothnessDiffs,
            downloadTime,
            lastBitrate;

        if (isNaN(throughput)) {
            return switchRequest;
        }

        switch (TestState.state) {
            case TEST_STATE_STARTUP:
                console.log("TEST_STATE_STARTUP");
                quality = abrController.getQualityForBitrate(mediaInfo, safeThroughput, streamId, latency);
                let cur = 0;
                for (let i = 0; i < setBitrates.length; i++) {
                    if (quality >= setBitrates[i]) {
                        cur = setBitrates[i];
                    }
                }
                console.log('cur:', cur, 'quality:', quality);

                switchRequest.quality = cur;
                switchRequest.reason.throughput = safeThroughput;

                TestState.lastQuality = quality;
                TestState.state = TEST_STATE_STEADY;
                break;

            case TEST_STATE_STEADY:
                console.log("TEST_STATE_STEADY");
                const startTime1 = performance.now();
                let newBufferLevel = bufferLevel;
                for (let bitrateSequence of TestState.chunkBitrateSequenceOptions) {
                    // const startTime2 = performance.now();
                    QoE = 0,
                    rebuffer = 0,
                    bitrateSum = 0,
                    smoothnessDiffs = 0,
                    maxQoE = -Infinity;
                    lastBitrate = TestState.lastQuality;

                    for (let i = 0; i< horizon; i++) {
                        let bitrate = bitrateSequence[i];

                        // downloadTime = calculateDownloadTimeFromParameter(throughput, loss, RTT, PTO, RTO, TestState.bitrates[bitrate]);
                        downloadTime = TestState.bitrates[bitrate] * videoChunkLength / throughput;

                        if (downloadTime > newBufferLevel) {
                            rebuffer += downloadTime - newBufferLevel;
                            newBufferLevel = 0;
                        }
                        else {
                            newBufferLevel -= downloadTime;
                        }

                        newBufferLevel += videoChunkLength;
                        bitrateSum += TestState.bitrates[bitrate];
                        smoothnessDiffs += Math.abs(TestState.bitrates[bitrate] - TestState.bitrates[lastBitrate])
                        lastBitrate = bitrate;
                    }

                    QoE += bitrateSum - smoothnessDiffs - rebufferPenalty * rebuffer;
                    if (QoE >= maxQoE) {
                        bitrateSequenceSelected = bitrateSequence;
                        maxQoE = QoE;
                    }

                    // const endTime2 = performance.now();
                    // const executionTime2 = endTime2 - startTime2;
                    // console.log('代码运行时间：', executionTime2, '毫秒');
                }
                const endTime1 = performance.now();
                const executionTime1 = endTime1 - startTime1;
                console.log('代码总运行时间：', executionTime1, '毫秒');

                switchRequest.quality = bitrateSequenceSelected[0];
                console.log("select %d: %d", bitrateSequenceSelected[0], TestState.bitrates[bitrateSequenceSelected[0]]);
                switchRequest.reason.throughput = throughput;
                switchRequest.reason.latency = latency;
                switchRequest.reason.bufferLevel = bufferLevel;

                TestState.lastQuality = bitrateSequenceSelected[0];
                break;
            default:
                logger.debug('Test ABR rule invoked in bad state.');
                switchRequest.quality = abrController.getQualityForBitrate(mediaInfo, safeThroughput, streamId, latency);
                switchRequest.reason.state = TestState.state;
                switchRequest.reason.throughput = safeThroughput;
                switchRequest.reason.latency = latency;
                TestState.state = TEST_STATE_STARTUP;
        }
        return switchRequest;
    }

    function resetInitialSettings() {
        TestStateDict = {};
    }

    function reset() {
        resetInitialSettings();
    }

    instance = {
        getMaxIndex: getMaxIndex,
        reset: reset
    };

    setup();
    return instance;
}

TestRuleClass.__dashjs_factory_name = 'TestRule';
TestRule = dashjs.FactoryMaker.getClassFactory(TestRuleClass);

