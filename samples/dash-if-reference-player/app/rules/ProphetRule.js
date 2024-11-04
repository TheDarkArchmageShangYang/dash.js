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

let ProphetRule;

function ProphetRuleClass() {
    console.log('Prophet is working');
    const videoChunkSize = [
        [59721,74169,55032,56752,47530,48364,52820,49355,64369,36633,43649,48694,42830,45718,63990,62758,50828,51562,46648,48850,44969,49044,60496,50175,53080,52660,56317,52637,49375,42919,50742,53291,45243,50672,52599,49961,55560,51362,40881,50600,55679,55011,53260,48729,51771,52515,44112,50897,53045,46375,53733,50278,61823,44786,36547,39424,52936,59631,51464,52019,57212,48904,49561,51894,46883,51827,52188,55886,55434,53024,41482,52031,47934,47183,44698,51038,47461,51041,57897,43518,43460,43535,45080,56131,49937,49600,77138,51357,54264,51314,51060,58447,44994,38175,46089,49101,28312],
        [87486,94315,72359,83221,69454,70403,80447,74985,93429,70013,57408,68881,68664,84631,85468,88381,77573,73137,66739,72366,65243,76597,85767,70381,77722,83024,92471,87330,81250,58801,65418,72895,72592,70917,73337,77279,87034,78350,62807,78074,78628,79043,82951,74861,85635,78292,66474,71180,73720,73034,74564,79374,95994,85907,57365,53790,75974,77631,72618,76411,84619,72802,76840,80648,68498,75383,77996,85448,90638,88690,85088,74826,63965,67645,51279,72732,70543,73711,83697,66294,74364,73604,78605,83252,71766,73444,100122,72190,85506,81519,77235,82829,73288,64219,52565,65856,56135],
        [141282,155827,125040,132607,112034,114896,128783,123227,153185,98829,91248,113559,99498,123232,144645,147821,130594,120658,108676,116393,99197,120017,147651,116841,123631,126590,142765,139888,108656,94771,113881,127315,115095,117183,116064,120714,133999,123482,100333,138757,127851,122093,136872,115124,135495,119260,98662,116296,127350,109471,120123,127296,149628,123861,86384,83717,124461,134057,132811,124026,129450,116099,124053,130463,106432,121818,128740,136393,146766,119155,116658,111724,106768,100540,99244,131075,110452,120822,141803,115278,103398,107080,118718,128730,121092,117544,170763,120712,135391,121879,121149,138163,115203,103073,84570,107278,72118],
        [218953,231330,189055,209810,173551,177261,192106,190249,244719,166842,144451,174113,155385,197257,214125,223037,188432,186326,173759,189036,164860,188360,216458,188676,193547,192804,218223,216186,190601,146458,175934,190280,178660,182171,178984,193979,211644,193952,149419,201294,198269,188203,215218,184676,205911,195942,165344,178456,183414,176489,183089,196611,226486,199295,146202,131514,198153,202243,202296,198212,201625,156593,193435,206887,173993,195841,202095,210742,229255,171833,210226,154935,165847,155217,151742,209823,182646,195681,220617,170063,155313,190203,183299,201206,186793,185300,254643,183638,205106,193881,180990,212814,177217,153836,136731,177376,127977],
        [327613,340673,276919,334168,288757,282294,302840,314841,377182,275692,235035,285280,284149,277642,363649,345885,297290,287556,265573,295248,296546,310864,311963,282115,302189,322093,356218,331153,298737,228213,276952,310924,277828,339414,272818,308675,338685,300519,249937,336902,296437,305301,324368,291838,337157,319314,262029,274638,312753,274483,290243,300092,374242,322134,228278,258882,321476,301420,332540,308907,300873,269519,307698,312585,282432,301917,319380,350749,368023,322230,309314,289413,239148,248664,259764,315827,274832,331052,325385,262121,301419,265485,330862,310590,303327,296150,359626,275235,329656,300547,295821,342840,294842,243770,250973,299933,195725],
        [495048,539060,437741,519944,415491,462280,484055,449221,574817,421932,372339,428719,439072,466443,534691,525796,441111,411722,456147,457741,462377,477442,467687,449741,457375,489476,521611,514843,463299,358332,457104,466066,433614,533085,405177,480537,514593,473115,371722,552033,451259,440345,494837,460394,511811,456215,428734,445441,470212,427764,444101,461834,565945,510654,341943,416254,495342,477456,490721,485090,459017,414412,459491,494962,428526,456536,477188,558141,530351,495705,475834,468108,353512,375450,431352,507235,415898,492767,506488,424089,452910,405540,512319,512686,431588,454667,547853,426119,496972,462022,447379,534685,450418,380312,384989,461381,299425],
        [838177,890702,651428,780381,655721,645147,795676,724605,865600,606958,541774,682486,694157,694246,802642,836127,667592,680419,724714,705051,633275,721273,837102,682849,695459,727460,825782,752561,673680,557765,678997,792068,655603,836023,674271,684530,776218,760938,566838,769212,734163,680953,796704,671422,791202,714558,595055,728935,733271,650464,718126,762338,850550,697022,499827,642144,742392,756078,818999,742264,660056,681145,709784,787899,656266,701815,773105,814188,796431,696241,728458,711438,549722,589569,662264,836745,642226,785252,792766,609521,649530,689970,743514,783785,671295,671707,923362,663888,738933,725988,658877,824650,663951,567505,642371,722166,444706],
        [1145867,1208905,931675,1191390,1057080,1119993,1026761,1134116,1245559,987497,866042,1075583,1028110,1129425,1200782,1089390,988925,1066544,1106191,1063010,1110709,1062813,1023521,1078931,1013406,1196057,1208483,1066893,1053130,952269,1089380,1063103,1015405,1274284,960433,1099079,1120348,1100378,962301,1194428,1021594,1018179,1128044,1048425,1172522,1048984,937673,1106402,1230806,955984,1014536,1090695,1259901,1135687,796181,1175867,1018254,1116360,1118076,1046064,1047156,1066037,1087601,1060251,1093037,1098037,1065720,1221041,1172284,1135503,1111459,1032489,929057,990724,968221,1179246,984872,1148998,1126258,1019862,1045316,1063175,1086668,1097903,1075409,1046519,1172168,1046934,1041771,1083179,1039387,1207119,981184,979956,1074550,1080462,716829],
        [1535564,1620285,1269756,1371500,1299593,1110665,1537560,1419367,1443640,1150344,1048950,1338900,1251304,1303358,1481963,1482209,1279246,1261881,1294098,1259269,1288054,1353055,1551507,1325069,1198053,1295347,1521939,1350854,1336747,968044,1440635,1415247,1160228,1727664,1187073,1287849,1415619,1413330,1002890,1507766,1242136,1302168,1388401,1251722,1416202,1321234,1178151,1381047,1483665,1144404,1306854,1319882,1589851,1219615,1039973,1294102,1508564,1266796,1594067,1316179,1300219,1186007,1375130,1346691,1162886,1318148,1369247,1680134,1305914,1283088,1324467,1227251,1218548,1177530,1317341,1551747,1138380,1451108,1452943,1143820,1205956,1256526,1423203,1332599,1379156,1294023,1575368,1270880,1324969,1319305,1266576,1493740,1211363,1099485,1352346,1294667,826712],
        [33578,32948,32770,32701,32965,32952,33122,32714,32991,32960,33137,32561,33008,33009,33041,32662,32900,33174,33118,32676,32940,33123,32941,32664,32970,33099,32900,32777,32956,33052,33477,32342,32997,33065,32995,32675,32972,33120,32981,32700,32917,33079,33285,32376,33120,32918,33018,32461,33217,32993,33234,32440,33062,32987,33005,32782,32984,33061,32925,32600,33137,32983,33036,32675,33037,32984,32997,32674,33071,33053,32965,32940,32907,32938,33010,32594,33002,33109,32962,32641,33012,33117,33109,32554,33127,32934,33028,32709,33008,33032,32934,32633,33000,33120,32951,32713,25812]
    ]

    // const videoChunkSize = [
    //     // [59721,74169,55032,56752,47530,48364,52820,49355,64369,36633,43649,48694,42830,45718,63990,62758,50828,51562,46648,48850,44969,49044,60496,50175,53080,52660,56317,52637,49375,42919,50742,53291,45243,50672,52599,49961,55560,51362,40881,50600,55679,55011,53260,48729,51771,52515,44112,50897,53045,46375,53733,50278,61823,44786,36547,39424,52936,59631,51464,52019,57212,48904,49561,51894,46883,51827,52188,55886,55434,53024,41482,52031,47934,47183,44698,51038,47461,51041,57897,43518,43460,43535,45080,56131,49937,49600,77138,51357,54264,51314,51060,58447,44994,38175,46089,49101,28312],
    //     [87486,94315,72359,83221,69454,70403,80447,74985,93429,70013,57408,68881,68664,84631,85468,88381,77573,73137,66739,72366,65243,76597,85767,70381,77722,83024,92471,87330,81250,58801,65418,72895,72592,70917,73337,77279,87034,78350,62807,78074,78628,79043,82951,74861,85635,78292,66474,71180,73720,73034,74564,79374,95994,85907,57365,53790,75974,77631,72618,76411,84619,72802,76840,80648,68498,75383,77996,85448,90638,88690,85088,74826,63965,67645,51279,72732,70543,73711,83697,66294,74364,73604,78605,83252,71766,73444,100122,72190,85506,81519,77235,82829,73288,64219,52565,65856,56135],
    //     // [141282,155827,125040,132607,112034,114896,128783,123227,153185,98829,91248,113559,99498,123232,144645,147821,130594,120658,108676,116393,99197,120017,147651,116841,123631,126590,142765,139888,108656,94771,113881,127315,115095,117183,116064,120714,133999,123482,100333,138757,127851,122093,136872,115124,135495,119260,98662,116296,127350,109471,120123,127296,149628,123861,86384,83717,124461,134057,132811,124026,129450,116099,124053,130463,106432,121818,128740,136393,146766,119155,116658,111724,106768,100540,99244,131075,110452,120822,141803,115278,103398,107080,118718,128730,121092,117544,170763,120712,135391,121879,121149,138163,115203,103073,84570,107278,72118],
    //     [218953,231330,189055,209810,173551,177261,192106,190249,244719,166842,144451,174113,155385,197257,214125,223037,188432,186326,173759,189036,164860,188360,216458,188676,193547,192804,218223,216186,190601,146458,175934,190280,178660,182171,178984,193979,211644,193952,149419,201294,198269,188203,215218,184676,205911,195942,165344,178456,183414,176489,183089,196611,226486,199295,146202,131514,198153,202243,202296,198212,201625,156593,193435,206887,173993,195841,202095,210742,229255,171833,210226,154935,165847,155217,151742,209823,182646,195681,220617,170063,155313,190203,183299,201206,186793,185300,254643,183638,205106,193881,180990,212814,177217,153836,136731,177376,127977],
    //     [327613,340673,276919,334168,288757,282294,302840,314841,377182,275692,235035,285280,284149,277642,363649,345885,297290,287556,265573,295248,296546,310864,311963,282115,302189,322093,356218,331153,298737,228213,276952,310924,277828,339414,272818,308675,338685,300519,249937,336902,296437,305301,324368,291838,337157,319314,262029,274638,312753,274483,290243,300092,374242,322134,228278,258882,321476,301420,332540,308907,300873,269519,307698,312585,282432,301917,319380,350749,368023,322230,309314,289413,239148,248664,259764,315827,274832,331052,325385,262121,301419,265485,330862,310590,303327,296150,359626,275235,329656,300547,295821,342840,294842,243770,250973,299933,195725],
    //     [495048,539060,437741,519944,415491,462280,484055,449221,574817,421932,372339,428719,439072,466443,534691,525796,441111,411722,456147,457741,462377,477442,467687,449741,457375,489476,521611,514843,463299,358332,457104,466066,433614,533085,405177,480537,514593,473115,371722,552033,451259,440345,494837,460394,511811,456215,428734,445441,470212,427764,444101,461834,565945,510654,341943,416254,495342,477456,490721,485090,459017,414412,459491,494962,428526,456536,477188,558141,530351,495705,475834,468108,353512,375450,431352,507235,415898,492767,506488,424089,452910,405540,512319,512686,431588,454667,547853,426119,496972,462022,447379,534685,450418,380312,384989,461381,299425],
    //     [838177,890702,651428,780381,655721,645147,795676,724605,865600,606958,541774,682486,694157,694246,802642,836127,667592,680419,724714,705051,633275,721273,837102,682849,695459,727460,825782,752561,673680,557765,678997,792068,655603,836023,674271,684530,776218,760938,566838,769212,734163,680953,796704,671422,791202,714558,595055,728935,733271,650464,718126,762338,850550,697022,499827,642144,742392,756078,818999,742264,660056,681145,709784,787899,656266,701815,773105,814188,796431,696241,728458,711438,549722,589569,662264,836745,642226,785252,792766,609521,649530,689970,743514,783785,671295,671707,923362,663888,738933,725988,658877,824650,663951,567505,642371,722166,444706],
    //     // [1145867,1208905,931675,1191390,1057080,1119993,1026761,1134116,1245559,987497,866042,1075583,1028110,1129425,1200782,1089390,988925,1066544,1106191,1063010,1110709,1062813,1023521,1078931,1013406,1196057,1208483,1066893,1053130,952269,1089380,1063103,1015405,1274284,960433,1099079,1120348,1100378,962301,1194428,1021594,1018179,1128044,1048425,1172522,1048984,937673,1106402,1230806,955984,1014536,1090695,1259901,1135687,796181,1175867,1018254,1116360,1118076,1046064,1047156,1066037,1087601,1060251,1093037,1098037,1065720,1221041,1172284,1135503,1111459,1032489,929057,990724,968221,1179246,984872,1148998,1126258,1019862,1045316,1063175,1086668,1097903,1075409,1046519,1172168,1046934,1041771,1083179,1039387,1207119,981184,979956,1074550,1080462,716829],
    //     // [1535564,1620285,1269756,1371500,1299593,1110665,1537560,1419367,1443640,1150344,1048950,1338900,1251304,1303358,1481963,1482209,1279246,1261881,1294098,1259269,1288054,1353055,1551507,1325069,1198053,1295347,1521939,1350854,1336747,968044,1440635,1415247,1160228,1727664,1187073,1287849,1415619,1413330,1002890,1507766,1242136,1302168,1388401,1251722,1416202,1321234,1178151,1381047,1483665,1144404,1306854,1319882,1589851,1219615,1039973,1294102,1508564,1266796,1594067,1316179,1300219,1186007,1375130,1346691,1162886,1318148,1369247,1680134,1305914,1283088,1324467,1227251,1218548,1177530,1317341,1551747,1138380,1451108,1452943,1143820,1205956,1256526,1423203,1332599,1379156,1294023,1575368,1270880,1324969,1319305,1266576,1493740,1211363,1099485,1352346,1294667,826712],
    //     [33578,32948,32770,32701,32965,32952,33122,32714,32991,32960,33137,32561,33008,33009,33041,32662,32900,33174,33118,32676,32940,33123,32941,32664,32970,33099,32900,32777,32956,33052,33477,32342,32997,33065,32995,32675,32972,33120,32981,32700,32917,33079,33285,32376,33120,32918,33018,32461,33217,32993,33234,32440,33062,32987,33005,32782,32984,33061,32925,32600,33137,32983,33036,32675,33037,32984,32997,32674,33071,33053,32965,32940,32907,32938,33010,32594,33002,33109,32962,32641,33012,33117,33109,32554,33127,32934,33028,32709,33008,33032,32934,32633,33000,33120,32951,32713,25812]
    // ]

    const context = this.context;

    const factory = dashjs.FactoryMaker;
    const SwitchRequest = factory.getClassFactoryByName('SwitchRequest');
    const DashMetrics = factory.getSingletonFactoryByName('DashMetrics');
    const dashMetrics = DashMetrics(context).getInstance();

    const Debug = factory.getSingletonFactoryByName('Debug');

    let instance,
        logger,
        TestStateDict;

    const TEST_STATE_ONE_BITRATE = 0;
    const TEST_STATE_STARTUP = 1;
    const TEST_STATE_STEADY = 2;

    const horizon = 5;

    const videoChunkLength = 2000;
    const rebufferPenalty = 3;
    const MTU = 1183;
    const MaxPacketSize = 1258;
    const setBitrates = [1,3,4,5,6];
    // const setBitrates = [0,1,2,3,4];

    let bandwidth_MPC = [];
    let bandwidth_comp = [];
    
    let chunkNumber = 1;

    function setup() {
        logger = Debug(context).getInstance().getLogger(instance);
        resetInitialSettings();
    }

    function getInitialTestState(rulesContext) {
        const initialState = {};
        const mediaInfo = rulesContext.getMediaInfo();
        const bitrates = mediaInfo.bitrateList.map(b => b.bandwidth / 1000); // 300,750,1200,1850,2850

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

        for (let i = 0; i < setBitrates.length; i++) {
            const newArray = [...currentArray, setBitrates[i]];
            getChunkBitrateSequenceOptions(TestState, horizon, newArray);
        }
    }

    function calculateTailRetransmitTime(bandwidth, loss, RTT, PTO, RTO, chunkSize) {
        let time = 0;
        let timeForPacket = MTU * 8 / bandwidth;
        // let timeForPacket = MTU / bandwidth;

        let N = Math.ceil(bandwidth * RTT / 8 / MTU);
        let lastPacketSize = bandwidth * RTT / 8 - (N - 1) * MTU;

        time += Math.pow(1-loss, N) * ((N-1)*timeForPacket + lastPacketSize * 8 / bandwidth);

        for (let i = 1; i <= N; i++) {
            let probabilityForFistLost = Math.pow(1-loss*loss, i-1) * loss*(1-loss) * Math.pow(1-loss, N-i);
            let timeForFistLost = (i-1)*(1-loss)*timeForPacket;
            let timeForTimeThreshold = RTT * 9 / 8;
            if (i == N) {
                timeForFistLost += PTO + lastPacketSize * 8 / bandwidth;
            }
            else if (timeForTimeThreshold < RTT + 2 * timeForPacket || i == N - 1) {
                timeForFistLost += RTT + 2 * timeForPacket;
            }
            else if (timeForTimeThreshold < RTT + 3 * timeForPacket || i == N - 2) {
                timeForFistLost += RTT + 3 * timeForPacket;
            }
            else {
                timeForFistLost += RTT + 4 * timeForPacket;
            }
            time += probabilityForFistLost * timeForFistLost;
    
            // let probabilityForSecondLost = Math.pow(1-loss*loss*loss, i-1) * loss*loss*(1-loss) * Math.pow(1-loss*loss, N-i);
            // let timeForSecondLost = timeForFistLost;
            // if (i == N) {
            //     timeForSecondLost += 2 * PTO + lastPacketSize / bandwidth;
            // }
            // else {
            //     timeForSecondLost + PTO + timeForPacket;
            // }

            let probabilityForSecondLostTriggerPTO = Math.pow(1-loss*loss, i-1) * loss*loss*(1-loss) * Math.pow(1-loss, N-i);
            let timeForSecondLostTriggerPTO = timeForFistLost + PTO + timeForPacket;

            let probabilityForSecondLostTriggerFastRetransmit = Math.pow(1-loss*loss*loss, i-1) * loss*loss*(1-loss) * Math.pow(1-loss*loss, N-i) - Math.pow(1-loss*loss, i-1) * loss*loss*(1-loss) * Math.pow(1-loss, N-i);
            let timeForSecondLostTriggerFastRetransmit = timeForFistLost + PTO + RTT + timeForPacket;

            if (i == N) {
                timeForSecondLostTriggerPTO = timeForFistLost + 2 * PTO + timeForPacket;
                timeForSecondLostTriggerFastRetransmit = timeForFistLost + 2 * PTO + RTT + timeForPacket;
            }

            time += probabilityForSecondLostTriggerPTO * timeForSecondLostTriggerPTO;
            time += probabilityForSecondLostTriggerFastRetransmit * timeForSecondLostTriggerFastRetransmit;
            // time += probabilityForSecondLost * timeForSecondLost;
        };
        return time; 
    }

    function calculateDownloadTimeFromParameter(bandwidth, loss, RTT, PTO, RTO, chunkSize) {
        bandwidth = bandwidth * MTU / MaxPacketSize;

        let time = 0;
        let downloadTime1 = RTT;
        let downloadTime2 = (chunkSize * 8 - bandwidth * RTT) / bandwidth / (1 - loss);
        // let downloadTime2 = (chunkSize * 8 - bandwidth * RTT) / bandwidth;
        let downloadTime3 = calculateTailRetransmitTime(bandwidth, loss, RTT, PTO, RTO, chunkSize);
        let threshold = chunkSize - bandwidth * RTT / 8;

        time += downloadTime1 + downloadTime2 + downloadTime3;

        return [downloadTime1, downloadTime2, downloadTime3, time, threshold];
    }

    function getMaxIndex(rulesContext) {
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

        const bufferLevel = dashMetrics.getCurrentBufferLevel(mediaType) * 1000;
        const throughput = throughputHistory.getAverageThroughput(mediaType, isDynamic);
        bandwidth_MPC.push(throughput);
        const safeThroughput = throughputHistory.getSafeAverageThroughput(mediaType, isDynamic);
        const latency = throughputHistory.getAverageLatency(mediaType);
        let quality;

        switchRequest.reason.state = TestState.state;
        switchRequest.reason.throughput = window.bandwidth_xquic;
        switchRequest.reason.latency = latency;
        let bitrateSequenceSelected = [],
            QoE,
            maxQoE = -Infinity,
            rebuffer,
            bitrateSum,
            smoothnessDiffs,
            downloadTime,
            downloadTimeForFirstChunk = [],
            downloadTimeSelected = [],
            lastBitrate;

        if (isNaN(throughput)) {
            return switchRequest;
        }
        
        console.log('prophet rule', window.bandwidth_xquic, window.loss_xquic, window.rtt_xquic, window.pto_xquic, window.rto_xquic);
        console.log('prophet rule bandwidth:', throughput);
        chunkNumber++;
        // console.log('chunkNumber: ', chunkNumber);

        switch (TestState.state) {
            case TEST_STATE_STARTUP:
                // console.log("TEST_STATE_STARTUP");
                quality = abrController.getQualityForBitrate(mediaInfo, safeThroughput, streamId, latency);
                
                let cur = 0;
                for (let i = 0; i < setBitrates.length; i++) {
                    if (quality >= setBitrates[i]) {
                        cur = setBitrates[i];
                    }
                }

                switchRequest.quality = cur;
                switchRequest.reason.throughput = safeThroughput;

                TestState.lastQuality = cur;
                if (chunkNumber >= 5) {
                    TestState.state = TEST_STATE_STEADY;
                }
                break;

            case TEST_STATE_STEADY:
                // console.log("TEST_STATE_STEADY");
                // const startTime1 = performance.now();
                let lastFiveThroughput = bandwidth_MPC.slice(-5);
                let harmonicBandwidth = lastFiveThroughput.length / lastFiveThroughput.reduce((acc, val) => acc + (1 / val), 0);
                console.log(harmonicBandwidth);
                bandwidth_comp.push([window.bandwidth_xquic.toFixed(3), window.loss_xquic.toFixed(3), window.rtt_xquic.toFixed(3), harmonicBandwidth.toFixed(3), throughput.toFixed(3)]);
                let table = bandwidth_comp.map((item, index) => {
                    return [index + 6, ...item];
                })
                console.table(table);
                // if (chunkNumber != 50) {
                let downloadTime1 = 0;
                let downloadTime2 = 0;
                let downloadTime3 = 0;
                let threshold = 0;
                for (let bitrateSequence of TestState.chunkBitrateSequenceOptions) {
                    // const startTime2 = performance.now();
                    let newBufferLevel = bufferLevel;
                    QoE = 0;
                    rebuffer = 0;
                    bitrateSum = 0;
                    smoothnessDiffs = 0;
                    lastBitrate = TestState.lastQuality;
                    downloadTimeForFirstChunk = 0;

                    for (let i = 0; i < horizon; i++) {
                        let bitrate = bitrateSequence[i];
                        [downloadTime1, downloadTime2, downloadTime3, downloadTime, threshold] = calculateDownloadTimeFromParameter(window.bandwidth_xquic, 
                                                                        window.loss_xquic, 
                                                                        window.rtt_xquic, 
                                                                        window.pto_xquic, 
                                                                        window.rto_xquic, 
                                                                        videoChunkSize[bitrate][chunkNumber-1]);
                        if (i == 0) {
                            downloadTimeForFirstChunk = [downloadTime1, downloadTime2, downloadTime3, downloadTime, threshold];
                        }
                        downloadTime *= 1 + videoChunkSize[9][chunkNumber-1] / videoChunkSize[bitrate][chunkNumber-1];
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
                    // console.log('downloadTime:',downloadTime);
                    // console.log('select:',bitrateSequence[0],bitrateSequence[1],'bitrateSum:',bitrateSum,'lastBitrate:',TestState.bitrates[TestState.lastQuality],'smoothnessDiffs:',smoothnessDiffs,'rebuffer:',rebuffer,'QoE:',QoE);
                    if (QoE >= maxQoE) {
                        // console.log('preSelect:',bitrateSequenceSelected[0],'preQoE:',maxQoE,'nowSelect:',bitrateSequence[0],'nowQoE:',QoE);
                        bitrateSequenceSelected = bitrateSequence;
                        downloadTimeSelected = downloadTimeForFirstChunk;
                        // console.log('QoE', QoE, bitrateSequenceSelected[0], bitrateSequenceSelected[1], 'downloadTimeSelected', downloadTimeSelected);
                        // console.log('downloadTimeFromProphetRule', downloadTimeSelected);
                        maxQoE = QoE;
                    }
                    // const endTime2 = performance.now();
                    // const executionTime2 = endTime2 - startTime2;
                    // console.log('代码运行时间：', executionTime2, '秒');
                }
                // }
                // else if (chunkNumber == 50) {
                //     let bitrate = 5;
                //     bitrateSequenceSelected = [5,5,5];

                //     downloadTimeSelected = calculateDownloadTimeFromParameter(window.bandwidth_xquic, 
                //                                                     window.loss_xquic, 
                //                                                     window.rtt_xquic, 
                //                                                     window.pto_xquic, 
                //                                                     window.rto_xquic, 
                //                                                     videoChunkSize[bitrate][chunkNumber-1]);

                //     console.log('for the 50th chunk, select quality 4');
                // }
                console.log('视频块', chunkNumber, '第1阶段:', downloadTimeSelected[0], '第2阶段:', downloadTimeSelected[1], '第3阶段:', downloadTimeSelected[2], '总时间:', downloadTimeSelected[3], '第2阶段和第3阶段边界:', downloadTimeSelected[4]);
                window.downloadTimePredict.splice(window.downloadTimePredict.length, 0, [downloadTimeSelected[3], bitrateSequenceSelected[0], chunkNumber]);
                console.log(downloadTimeSelected[3], bitrateSequenceSelected[0], chunkNumber);
                // const endTime1 = performance.now();
                // const executionTime1 = endTime1 - startTime1;
                // console.log('代码总运行时间：', executionTime1, '毫秒');

                switchRequest.quality = bitrateSequenceSelected[0];
                // console.log("select %d: %d", bitrateSequenceSelected[0], TestState.bitrates[bitrateSequenceSelected[0]]);
                switchRequest.reason.throughput = window.bandwidth_xquic;
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

ProphetRuleClass.__dashjs_factory_name = 'ProphetRule';
ProphetRule = dashjs.FactoryMaker.getClassFactory(ProphetRuleClass);
