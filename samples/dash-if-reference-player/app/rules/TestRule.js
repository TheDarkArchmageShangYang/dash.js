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

const horizon = 4;
const bufferMaxSize = 25;
const videoChunkLength = 2;
const rebufferPenalty = 1.85;
const MTU = 1166;

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
        qualityDict = [];

    function setup() {
        logger = Debug(context).getInstance().getLogger(instance);
        resetInitialSettings();
    }

    function getInitialTestState(rulesContext) {
        const initialState = {};
        const mediaInfo = rulesContext.getMediaInfo();
        // const bitrates = mediaInfo.bitrateList.map(b => b.bandwidth);
        const bitrates = [1,3,4,5,6];
        // const bitrates = [8];

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

    function getChunkBitrateSequenceOptions(TestState, horizon, currentArray = []) {
        if (currentArray.length === horizon) {
            TestState.chunkBitrateSequenceOptions.push([...currentArray]);
            return;
        }

        // for (let i = 0; i < TestState.bitrates.length; i++) {
        //     const newArray = [...currentArray, i];
        //     getChunkBitrateSequenceOptions(TestState, horizon, newArray);
        // }

        for (let i = 0; i < TestState.bitrates.length; i++) {
            const newArray = [...currentArray, TestState.bitrates[i]];
            getChunkBitrateSequenceOptions(TestState, horizon, newArray);
        }
    }

    function calculateTimeForTimeout(timeForPacket, loss, PTO, RTO) {
        let time = 0;
        time += (PTO+timeForPacket)+loss*(2*PTO+timeForPacket);
        for (let i = 0; i < 7; i++) {
                time += Math.pow(loss, i+2)*(Math.pow(2,i)*RTO+timeForPacket);
        }
        return time;
    }

    function calculate(bandwidth, loss, RTT) {
        let blockTime = 0;
        let timeForPacket = MTU / bandwidth;

        let N1 = Math.ceil(65536.0 / MTU);
        let N2 = Math.floor(131072.0 / MTU);
        let timeForTwoPartPacket = (N2*(1-loss) + N1*loss*(1-loss)) * timeForPacket;

        let probabilityWithBlock = 0;
        let totalTime = 0;

        for (let i = 1; i <= N1; i++) {
                let transmitTime = (i-1)*(1-loss)*timeForPacket;
                let retransmitTime = transmitTime + RTT + 4*timeForPacket;

                let timeForFirstLost = retransmitTime + RTT - timeForTwoPartPacket;
                let probabilityForFirstLost = (Math.pow(1-loss*loss, i-1) * (loss*(1-loss)) * Math.pow(1-loss, N1-i));
                
                let timeForSecondLost = timeForFirstLost + RTT + 3 * timeForPacket;
                let probabilityForSecondLost = (Math.pow(1-loss*loss*loss, i-1) * (loss*loss*(1-loss)) * Math.pow(1-loss*loss, N1-i));

                if (timeForFirstLost > 0) {
                        blockTime += probabilityForFirstLost * timeForFirstLost;
                        probabilityWithBlock += probabilityForFirstLost;
                }
                if (timeForSecondLost > 0) {
                        blockTime += probabilityForSecondLost * timeForSecondLost;
                        probabilityWithBlock += probabilityForSecondLost;
                }
                totalTime += probabilityForFirstLost * (timeForFirstLost-0.5*RTT+timeForTwoPartPacket) + probabilityForSecondLost * (timeForSecondLost-0.5*RTT+timeForTwoPartPacket);
        }

        return [blockTime, probabilityWithBlock, totalTime];
    }

    function calculateBlockTimeWithoutBlock(start, bandwidth, loss, RTT, PTO, RTO, bitrate, blockTimeWithoutBlock, blockProbabilityWithoutBlock, totalTimeWithoutBlock) {
        let blockTime = blockTimeWithoutBlock;
        // return blockTime;
        let N1 = Math.ceil(65536.0 / MTU);

        if (start < 0) {
                start = 0;
        }
        else {
                start += N1 * 1166;
        }

        if (start + 131072 >= bitrate * videoChunkLength / 8) {
                blockTime += calculateRetransmitTime(start, bandwidth, loss, RTT, PTO, RTO, bitrate);
                return blockTime;
        }
        if (1 - blockProbabilityWithoutBlock > 0) {
            blockTime += (1 - blockProbabilityWithoutBlock) * calculateBlockTimeWithoutBlock(start, bandwidth, loss, RTT, PTO, RTO, bitrate, blockTimeWithoutBlock, blockProbabilityWithoutBlock, totalTimeWithoutBlock);
        }
        if (blockProbabilityWithoutBlock > 0) {
            blockTime += blockProbabilityWithoutBlock * calculateBlockTimeWithBlock(start, bandwidth, loss, RTT, PTO, RTO, blockTimeWithoutBlock, totalTimeWithoutBlock, blockTimeWithoutBlock, blockProbabilityWithoutBlock, totalTimeWithoutBlock, bitrate);
        }
        return blockTime;
    }

    function calculateBlockTimeWithBlock(start, bandwidth, loss, RTT, PTO, RTO, blockTimeLast, totalTimeLast, blockTimeWithoutBlock, blockProbabilityWithoutBlock, totalTimeWithoutBlock, bitrate) {
        let blockTime = 0;
        let timeForPacket = MTU / bandwidth;
        let timeForTimeout = calculateTimeForTimeout(timeForPacket, loss, PTO, RTO);

        let N1 = 65536 / MTU + 1;
        let N2 = 131072 / MTU;
        let timeForTwoPartPacket = N2 * (1-loss) * timeForPacket;
        let probabilityWithBlock = 0;
        let totalTime = 0;

        let lastStart = start;
        start += N1 * MTU;

        let probability = 1;

        for (let i = N1 + 1; i <= N2; i++) {
                let transmitTime = (i-1)*(1-loss)*timeForPacket;
                let retransmitTime = transmitTime + RTT + 4*timeForPacket;
                let timeForFirstLost = retransmitTime + 0.5*RTT;
                let probabilityForFirstLost = loss;
                let timeForSecondLost = timeForFirstLost + RTT + 3 * timeForPacket;
                let probabilityForSecondLost = loss*loss;
                if (timeForFirstLost > totalTimeLast) {
                        probability *= 1 - probabilityForFirstLost;
                        start += probability * MTU;
                }
                else if ((timeForFirstLost <= totalTimeLast) && (timeForSecondLost > totalTimeLast)) {
                        probability *= 1 - probabilityForSecondLost;
                        start += probability * MTU;
                }
                else if (timeForSecondLost <= totalTimeLast){
                        start += MTU;
                }
        }

        
        let pknBeforeBlock = (lastStart + 131072 - start) / MTU + 1;

        for (let i = 1; i <= pknBeforeBlock; i++) {
                let transmitTime = (i-1)*(1-loss)*timeForPacket-blockTimeLast;
                let retransmitTime = transmitTime + RTT + Math.min(4,N1-i+1)*timeForPacket;
                let timeForFirstLost = retransmitTime + RTT - timeForTwoPartPacket;
                let probabilityForFirstLost = (Math.pow(1-loss*loss, i-1) * (loss*(1-loss)) * Math.pow(1-loss, N1-i));

                let timeForSecondLost = timeForFirstLost + 2 * RTT;
                let probabilityForSecondLost = loss*loss*(1-loss)*(Math.pow(1-loss*loss*loss, i-1)*Math.pow(1-loss*loss, N1-i)-Math.pow(1-loss*loss, i-1)*Math.pow(1-loss, N1-i));
                let probabilityForTimeout = loss*loss*(1-loss)*Math.pow(1-loss*loss, i-1)*Math.pow(1-loss, N1-i);

                if (timeForFirstLost > 0) {
                        blockTime += probabilityForFirstLost * timeForFirstLost;
                        probabilityWithBlock += probabilityForFirstLost;
                }
                if (timeForSecondLost > 0) {
                        blockTime += probabilityForSecondLost * timeForSecondLost;
                        probabilityWithBlock += probabilityForSecondLost;
                }
                if (timeForFirstLost + timeForTimeout > 0) {
                        blockTime += probabilityForTimeout * (timeForFirstLost+timeForTimeout);
                        probabilityWithBlock += probabilityForTimeout;
                }
                totalTime += probabilityForFirstLost * (timeForFirstLost-0.5*RTT+timeForTwoPartPacket);
                totalTime += probabilityForSecondLost * (timeForSecondLost-0.5*RTT+timeForTwoPartPacket);
                totalTime += probabilityForTimeout * (timeForFirstLost+timeForTimeout-0.5*RTT+timeForTwoPartPacket);
                
        }
        for (let i = pknBeforeBlock + 1; i < N1; i++) {
                let transmitTime = (i-1)*(1-loss)*timeForPacket;
                let retransmitTime = transmitTime + RTT + Math.min(4,N1-i+1)*timeForPacket;
                let timeForFirstLost = retransmitTime + RTT - timeForTwoPartPacket;
                let probabilityForFirstLost = (Math.pow(1-loss*loss, i-1) * (loss*(1-loss)) * Math.pow(1-loss, N1-i));

                let timeForSecondLost = timeForFirstLost + RTT + 3 * timeForPacket;
                let probabilityForSecondLost = loss*loss;
                if (timeForFirstLost > 0) {
                        blockTime += probabilityForFirstLost * timeForFirstLost;
                        probabilityWithBlock += probabilityForFirstLost;
                }
                if (timeForSecondLost > 0) {
                        blockTime += probabilityForSecondLost * timeForSecondLost;
                        probabilityWithBlock += probabilityForSecondLost;
                }
                totalTime += probabilityForFirstLost * (timeForFirstLost-0.5*RTT+timeForTwoPartPacket);
                totalTime += probabilityForSecondLost * (timeForSecondLost-0.5*RTT+timeForTwoPartPacket);
                
        }

        if (start + 131072 >= bitrate * videoChunkLength / 8) {
                blockTime += calculateRetransmitTime(start, bandwidth, loss, RTT, PTO, RTO, bitrate);
                return blockTime;
        }
        if (1 - probabilityWithBlock > 0) {
            blockTime += (1 - probabilityWithBlock) * calculateBlockTimeWithoutBlock(start, bandwidth, loss, RTT, PTO, RTO, bitrate, blockTimeWithoutBlock, blockProbabilityWithoutBlock, totalTimeWithoutBlock);
        }
        if (probabilityWithBlock > 0) {
            blockTime += probabilityWithBlock * calculateBlockTimeWithBlock(start, bandwidth, loss, RTT, PTO, RTO, blockTime, totalTime, blockTimeWithoutBlock, blockProbabilityWithoutBlock, totalTimeWithoutBlock, bitrate);
        }
        return blockTime;
    }

    function calculateRetransmitTime(start, bandwidth, loss, RTT, PTO, RTO, bitrate) {
        let time = 0;
        let timeForPacket = MTU / bandwidth;
        let timeForTimeout = calculateTimeForTimeout(timeForPacket, loss, PTO, RTO);

        let N1 = (bitrate * videoChunkLength / 8 - start) / MTU + 1;
        let timeForTwoPartPacket = (bitrate * videoChunkLength / 8 - start) * (1-loss) / bandwidth;

        for (let i = 1; i < N1; i++) {
                let transmitTime = (i-1)*(1-loss)*timeForPacket;
                let retransmitTime = transmitTime + RTT + Math.min(4,N1-i+1)*timeForPacket;

                let timeForFirstLost = (retransmitTime - timeForTwoPartPacket) > 0 ? retransmitTime - timeForTwoPartPacket : 0;
                let probabilityForFirstLost = Math.pow(1-loss*loss, i-1) * (loss*(1-loss)) * Math.pow(1-loss, N1-i);
                time += probabilityForFirstLost * timeForFirstLost;

                let timeForSecondLost = (timeForFirstLost + 2 * RTT) > 0 ? timeForFirstLost + 2 * RTT : 0;
                let probabilityForSecondLost = loss*loss*(1-loss) * (Math.pow(1-loss*loss*loss, i-1)*Math.pow(1-loss*loss, N1-i)-Math.pow(1-loss*loss, i-1)*Math.pow(1-loss, N1-i));
                time += probabilityForSecondLost * timeForSecondLost;

                let probabilityForTimeout = loss*loss*(1-loss) * Math.pow(1-loss*loss, i-1)*Math.pow(1-loss, N1-i);
                time += probabilityForTimeout * (timeForFirstLost+timeForTimeout);
        };

        time += loss*(1-loss) * (Math.pow(1-loss*loss, N1-1)-Math.pow(1-loss, N1-1)) * 3*RTT;
        time += loss*(1-loss) * Math.pow(1-loss, N1-1) * (timeForTimeout+RTT);

        return time; 
    }

    function calculateDownloadTimeFromParameter(bandwidth, loss, RTT, PTO, RTO, bitrate) {
        bandwidth = bandwidth * 1166 / 1258;

        let time = 0;
        time += RTT + bitrate * videoChunkLength / bandwidth;

        if (bitrate * videoChunkLength / 8 <= 131072) {
            time += calculateRetransmitTime(0, bandwidth, loss, RTT, PTO, RTO, bitrate);
            return time;
        }

        let [a, b, c] = calculate(bandwidth, loss, RTT);

        time += calculateBlockTimeWithoutBlock(-1, bandwidth, loss, RTT, PTO, RTO, bitrate, a, b, c);

        return time;
    }

    function getMaxIndex(rulesContext) {
        console.log("Test Rule is working");
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

        // const bufferLevel = dashMetrics.getCurrentBufferLevel(mediaType);
        // const throughput = throughputHistory.getAverageThroughput(mediaType, isDynamic);
        const safeThroughput = throughputHistory.getSafeAverageThroughput(mediaType, isDynamic);
        let bufferLevel = 15;
        const throughput = 200000;
        const RTT = 0.2525;
        const loss = 0.1;
        const PTO = RTT + 0.2;
        const RTO = 1;
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
            downloadTime;

        if (isNaN(throughput)) {
            return switchRequest;
        }

        switch (TestState.state) {
            case TEST_STATE_STARTUP:
                console.log("TEST_STATE_STARTUP");
                quality = abrController.getQualityForBitrate(mediaInfo, safeThroughput, streamId, latency);

                switchRequest.quality = quality;
                switchRequest.reason.throughput = safeThroughput;

                qualityDict.push(quality);
                TestState.lastQuality = quality;
                TestState.state = TEST_STATE_STEADY;
                break;

            case TEST_STATE_STEADY:
                console.log("TEST_STATE_STEADY");
                console.log("sequence length:%d", TestState.chunkBitrateSequenceOptions.length);
                const startTime1 = performance.now();
                for (let bitrateSequence of TestState.chunkBitrateSequenceOptions) {
                    const startTime2 = performance.now();
                    QoE = 0,
                    rebuffer = 0,
                    bitrateSum = 0,
                    smoothnessDiffs = 0,
                    maxQoE = -Infinity;
                    lastBitrate = TestState.lastQuality;

                    for (let i = 0; i< horizon; i++) {
                        let bitrate = bitrateSequence[i];

                        downloadTime = calculateDownloadTimeFromParameter(throughput, loss, RTT, PTO, RTO, TestState.bitrates[bitrate]);
                        // downloadTime = TestState.bitrates[bitrate] * videoChunkLength / throughput;
                        if (downloadTime > bufferLevel) {
                            rebuffer += downloadTime - bufferLevel;
                            bufferLevel = 0;
                        }
                        else {
                            bufferLevel -= downloadTime;
                        }
                        bufferLevel += videoChunkLength;
                        bitrateSum += TestState.bitrates[bitrate];
                        // console.log("bitrateInfo:%d bitrate:%d lastBitrate:%d", bitrate, TestState.bitrates[bitrate], TestState.bitrates[lastBitrate]);
                        smoothnessDiffs += Math.abs(TestState.bitrates[bitrate] - TestState.bitrates[lastBitrate])
                        lastBitrate = bitrate;
                    }

                    QoE += bitrateSum - smoothnessDiffs - rebufferPenalty * rebuffer;
                    // console.log("bitrateSum:%d smoothnessDiffs:%d rebuffer:%d QoE:%d", bitrateSum, smoothnessDiffs, rebuffer, QoE);
                    if (QoE >= maxQoE) {
                        bitrateSequenceSelected = bitrateSequence;
                        maxQoE = QoE;
                    }
                    // console.log("Options:%d|%d|%d|%d|%d: %f, max: %f", bitrateSequence[0], bitrateSequence[1], bitrateSequence[2], bitrateSequence[3], bitrateSequence[4], QoE, maxQoE);
                    // console.log("Options:%d|%d: %f, max: %f", bitrateSequenceSelected[0], bitrateSequenceSelected[1], QoE, maxQoE);
                    const endTime2 = performance.now();
                    const executionTime2 = endTime2 - startTime2;
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

                qualityDict.push(bitrateSequenceSelected[0]);
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

