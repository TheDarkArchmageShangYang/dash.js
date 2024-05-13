#include <iostream>
#include <iomanip>
#include <cmath>
#include <chrono>
#include <fstream>
#include <sstream>

using namespace std;
//int index = 1;
double calculateTimeForTimeout(double timeForPacket, double loss, double PTO, double RTO) {
        double time = 0;
        time += (PTO+timeForPacket)+loss*(2*PTO+timeForPacket);
        for (int i = 0; i < 7; i++) {
                time += pow(loss, i+2)*(pow(2,i)*RTO+timeForPacket);
        }
        return time;
}

double calculateBlockTimeWithoutBlock(int start, double bandwidth, double loss, double RTT);
double calculateBlockTimeWithBlock(int start, double bandwidth, double loss, double RTT, double blockTime, double totalTime);
double calculateRetransmitTime(int start, double bandwidth, double loss, double RTT);

double calculateBlockTimeWithoutBlock(int start, double bandwidth, double loss, double RTT) {
        //cout << "this is calculateBlockTimeWithoutBlock" << endl;
        double PTO = RTT + 200;
        double RTO = 1000;
        double blockTime = 0;
        int MTU = 1166;
        double timeForPacket = MTU / bandwidth;  //5.032ms
        double timeForTimeout = calculateTimeForTimeout(timeForPacket, loss, PTO, RTO);

        int N1 = 65536 / MTU + 1; //57
        int N2 = 131072 / MTU;    //112
        double timeForTwoPartPacket = (N2*(1-loss) + N1*loss*(1-loss)) * timeForPacket;
        double probabilityWithoutBlock = 0, probabilityWithBlock = 0;
        double totalTime = 0;
        for (int i = 1; i <= N1; i++) {
                double transmitTime = (i-1)*(1-loss)*timeForPacket;
                double retransmitTime = transmitTime + RTT + 4*timeForPacket;
                double timeForFirstLost = retransmitTime + RTT - timeForTwoPartPacket;//在1-N1最多重传1次时，i是最后一次重传的包时的阻塞时间
                double probabilityForFirstLost = (pow(1-loss*loss, i-1) * (loss*(1-loss)) * pow(1-loss, N1-i));//在1-N1最多重传1次时，i是最后一次重传的包的概率
                double timeForSecondLost = timeForFirstLost + RTT + 3 * timeForPacket;
                double probabilityForSecondLost = (pow(1-loss*loss*loss, i-1) * (loss*loss*(1-loss)) * pow(1-loss*loss, N1-i));

                if (timeForFirstLost > 0) {
                        blockTime += probabilityForFirstLost * timeForFirstLost;
                        probabilityWithBlock += probabilityForFirstLost;
                }
                //if (index == 0) {
                //cout << "第 " << i << " 号包: 第1次重传: " << "probability: " << probabilityForFirstLost << "  timeForSecondLost: " << timeForFirstLost << endl; 
                //}
                if (timeForSecondLost > 0) {
                        blockTime += probabilityForSecondLost * timeForSecondLost;
                        probabilityWithBlock += probabilityForSecondLost;
                }
                //if (index == 0) {
                //cout << "第 " << i << " 号包: 第2次重传: " << "probability: " << probabilityForSecondLost << "  timeForSecondLost: " << timeForSecondLost << endl; 
                //}
                totalTime += probabilityForFirstLost * (timeForFirstLost-0.5*RTT+timeForTwoPartPacket) + probabilityForSecondLost * (timeForSecondLost-0.5*RTT+timeForTwoPartPacket);
        }
        probabilityWithoutBlock = 1 - probabilityWithBlock;
        //index = 1;

        if (start < 0) {
                start = 0;
        }
        else {
                start += N1 * 1166;
        }
        //cout << "withoutBlock: " << "start: " << start << " blockTime: " << blockTime << endl;
        if (start + 131072 >= 524288) {
                blockTime += calculateRetransmitTime(start, bandwidth, loss, RTT);
                return blockTime;
        }
        double blockTimeWithoutBlock = calculateBlockTimeWithoutBlock(start, bandwidth, loss, RTT);
        blockTime += probabilityWithoutBlock * blockTimeWithoutBlock;
        if (probabilityWithBlock > 0) {
                double blockTimeWithBlock = calculateBlockTimeWithBlock(start, bandwidth, loss, RTT, blockTime, totalTime);
                blockTime += probabilityWithBlock * blockTimeWithBlock;
        }
        return blockTime;
}

double calculateBlockTimeWithBlock(int start, double bandwidth, double loss, double RTT, double blockTimeLast, double totalTimeLast) {
        double PTO = RTT + 200;
        double RTO = 1000;
        double blockTime = 0;
        int MTU = 1166;
        double timeForPacket = MTU / bandwidth;
        double timeForTimeout = calculateTimeForTimeout(timeForPacket, loss, PTO, RTO);

        int N1 = 65536 / MTU + 1; //57
        int N2 = 131072 / MTU;    //112
        double timeForTwoPartPacket = (N2*(1-loss) + N1*loss*(1-loss)) * timeForPacket;
        double probabilityWithoutBlock = 0, probabilityWithBlock = 0;
        double totalTime = 0;

        int lastStart = start;
        start += N1 * MTU;

        double probability = 1;

        for (int i = N1 + 1; i <= N2; i++) {
                double transmitTime = (i-1)*(1-loss)*timeForPacket;
                double retransmitTime = transmitTime + RTT + 4*timeForPacket;
                double timeForFirstLost = retransmitTime + 0.5*RTT;
                double probabilityForFirstLost = loss;
                double timeForSecondLost = timeForFirstLost + RTT + 3 * timeForPacket;
                double probabilityForSecondLost = loss*loss;
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
                //cout << i << ": " << start << endl;
        }

        
        int pknBeforeBlock = (lastStart + 131072 - start) / MTU + 1;

        for (int i = 1; i <= pknBeforeBlock; i++) {
                double transmitTime = (i-1)*(1-loss)*timeForPacket-blockTimeLast;
                double retransmitTime = transmitTime + RTT + min(4,N1-i+1)*timeForPacket;
                double timeForFirstLost = retransmitTime + RTT - timeForTwoPartPacket;
                double probabilityForFirstLost = (pow(1-loss*loss, i-1) * (loss*(1-loss)) * pow(1-loss, N1-i));

                double timeForSecondLost = timeForFirstLost + 2 * RTT;
                double probabilityForSecondLost = loss*loss*(1-loss)*(pow(1-loss*loss*loss, i-1)*pow(1-loss*loss, N1-i)-pow(1-loss*loss, i-1)*pow(1-loss, N1-i));
                double probabilityForTimeout = loss*loss*(1-loss)*pow(1-loss*loss, i-1)*pow(1-loss, N1-i);

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
        for (int i = pknBeforeBlock + 1; i < N1; i++) {
                double transmitTime = (i-1)*(1-loss)*timeForPacket;
                double retransmitTime = transmitTime + RTT + min(4,N1-i+1)*timeForPacket;
                double timeForFirstLost = retransmitTime + RTT - timeForTwoPartPacket;
                double probabilityForFirstLost = (pow(1-loss*loss, i-1) * (loss*(1-loss)) * pow(1-loss, N1-i));

                double timeForSecondLost = timeForFirstLost + RTT + 3 * timeForPacket;
                double probabilityForSecondLost = loss*loss;
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
        probabilityWithoutBlock = 1 - probabilityWithBlock;


        //cout << "withBlock: " << "start: " << start << " blockTime: " << blockTime << endl;
        if (start + 131072 >= 524288) {
                blockTime += calculateRetransmitTime(start, bandwidth, loss, RTT);
                return blockTime;
        }
        double blockTimeWithoutBlock = calculateBlockTimeWithoutBlock(start, bandwidth, loss, RTT);
        blockTime += probabilityWithoutBlock * blockTimeWithoutBlock;
        if (probabilityWithBlock > 0) {
                double blockTimeWithBlock = calculateBlockTimeWithBlock(start, bandwidth, loss, RTT, blockTime, totalTime);
                blockTime += probabilityWithBlock * blockTimeWithBlock;
        }
        return blockTime;
}

double calculateRetransmitTime(int start, double bandwidth, double loss, double RTT) {
        double PTO = RTT + 200;
        double RTO = 1000;
        double time = 0;
        int MTU = 1166;
        double timeForPacket = MTU / bandwidth;  //5.032ms
        double timeForTimeout = calculateTimeForTimeout(timeForPacket, loss, PTO, RTO);

        int N1 = (524288 - start) / MTU + 1;
        double timeForTwoPartPacket = N1*(1-loss) * timeForPacket;
        for (int i = 1; i < N1; i++) {
                double transmitTime = (i-1)*(1-loss)*timeForPacket;
                double retransmitTime = transmitTime + RTT + min(4,N1-i+1)*timeForPacket;
                double timeForFirstLost = retransmitTime - timeForTwoPartPacket;
                if (timeForFirstLost < 0) {
                        timeForFirstLost = 0;
                }
                double probabilityForFirstLost = pow(1-loss*loss, i-1) * (loss*(1-loss)) * pow(1-loss, N1-i);
                time += probabilityForFirstLost * timeForFirstLost;
                //cout << "第 " << i << " 号包: 第1次重传: " << "probability: " << probabilityForFirstLost << "  timeForFistLost: " << timeForFirstLost << endl; 

                double timeForSecondLost = timeForFirstLost + 2 * RTT;
                double probabilityForSecondLost = loss*loss*(1-loss) * (pow(1-loss*loss*loss, i-1)*pow(1-loss*loss, N1-i)-pow(1-loss*loss, i-1)*pow(1-loss, N1-i));
                time += probabilityForSecondLost * timeForSecondLost;
                //cout << "第 " << i << " 号包: 第2次重传: " << "probability: " << probabilityForSecondLost << "  timeForSecondLost: " << timeForSecondLost << endl; 
                // cout << pow(1-loss*loss*loss, i-1)*pow(1-loss*loss, N1-i) << endl;
                // cout << pow(1-loss*loss, i-1)*pow(1-loss, N1-i) << endl;
                //cout << loss*loss*(1-loss) * (pow(1-loss*loss*loss, i-1)*pow(1-loss*loss, N1-i)-pow(1-loss*loss, i-1)*pow(1-loss, N1-i)) << endl;

                double probabilityForTimeout = loss*loss*(1-loss) * pow(1-loss*loss, i-1)*pow(1-loss, N1-i);
                time += probabilityForTimeout * (timeForFirstLost+timeForTimeout);
                //cout << "第 " << i << " 号包: 超时: " << "probability: " << probabilityForTimeout << "  timeForTimeout: " << timeForTimeout << endl; 

                //cout << time << endl;
        };

        time += (pow(1-loss*loss, N1-1)-pow(1-loss, N1-1)) * loss*(1-loss) * 3*RTT;
        time += pow(1-loss, N1-1) * loss*(1-loss) * (timeForTimeout+RTT);

        //cout << "end: " << "start: " << start << " blockTime: " << time << endl;
        return time; 
}

float calculateTimeFromParameter(double videoChunkSize, double bandwidth, double loss, double RTT) {
        bandwidth = bandwidth * 1166 / 1258;
        double time = 0;

        //time = calculateRetransmitTime(434950, bandwidth, loss, RTT);
        time += RTT + videoChunkSize / bandwidth;
        //cout << time << endl;

        time += calculateBlockTimeWithoutBlock(-1, bandwidth, loss, RTT);
        //cout << time << endl;

        return time;
}

int main(int argc, char *argv[]) {
        double videoChunkSize = 524288;
        int num = 0;
        
        double rtt = 252.5;
        double bw = 2000;
        double loss = 0.1;
        int bw_index = 3, loss_index = 0, rtt_index = 0;
        int last_pkn_number = 0, now_pkn_number = 0;
        double data[5][9][5] = {0};
        double bw_ave[5][9][5] = {0};
        double loss_ave[5][9][5] = {0};
        double rtt_ave[5][9][5] = {0};

        ifstream file("/home/fzchen/data.txt");

        if (!file.is_open()) {
                cerr << "Error opening file" << endl;
                return 1;
        }

        string line;
        while (getline(file, line)) {
                stringstream ss(line);
                string token;
                while (getline(ss, token, '|')) {
                        if (token.empty())
                                continue;
                        istringstream iss(token);
                        string key, value;
                        getline(iss, key, ':');
                        getline(iss, value, ':');
                        if (key == "pkn_number") {
                                last_pkn_number = now_pkn_number;
                                now_pkn_number = stoi(value);
                                //cout << " bw: " << bw << " loss: " << loss << " rtt: " << rtt << endl;
                                //cout << " bw_index: " << bw_index << " loss_index: " << loss_index << " rtt_index: " << rtt_index << endl;
                                
                                data[bw_index][loss_index][rtt_index] += calculateTimeFromParameter(videoChunkSize, bw/8, loss, rtt);
                                bw_ave[bw_index][loss_index][rtt_index] += bw;
                                loss_ave[bw_index][loss_index][rtt_index] += loss;
                                rtt_ave[bw_index][loss_index][rtt_index] += rtt;
                                num++;
                                if (last_pkn_number > now_pkn_number) {
                                        data[bw_index][loss_index][rtt_index] = data[bw_index][loss_index][rtt_index] / num;
                                        bw_ave[bw_index][loss_index][rtt_index] = bw_ave[bw_index][loss_index][rtt_index] / num;
                                        loss_ave[bw_index][loss_index][rtt_index] = loss_ave[bw_index][loss_index][rtt_index] / num;
                                        rtt_ave[bw_index][loss_index][rtt_index] = rtt_ave[bw_index][loss_index][rtt_index] / num;
                                        num = 0;
                                        loss_index += (rtt_index + 1) / 5;
                                        rtt_index = (rtt_index + 1) % 5;
                                }
                        }
                        else if (key == "bw") {
                                bw = stod(value) / 1000;
                        }
                        else if (key == "loss") {
                                loss = stod(value);
                        }
                        else if (key == "rtt") {
                                rtt = stod(value) / 1000;
                        }
                }
        }
        file.close();

        data[bw_index][loss_index][rtt_index] = data[bw_index][loss_index][rtt_index] / num;
        bw_ave[bw_index][loss_index][rtt_index] = bw_ave[bw_index][loss_index][rtt_index] / num;
        loss_ave[bw_index][loss_index][rtt_index] = loss_ave[bw_index][loss_index][rtt_index] / num;
        rtt_ave[bw_index][loss_index][rtt_index] = rtt_ave[bw_index][loss_index][rtt_index] / num;

        for (int y = 0; y <= loss_index; y++) {
                for (int z = 0; z <= 4; z++) {
                        cout << "control[" << bw_index << "][" << y << "][" << z << "] = " << data[bw_index][y][z] << endl;
                }
                cout << endl;
        }

        cout << fixed << setprecision(6);
        for (int y = 0; y <= loss_index; y++) {
                for (int z = 0; z <= 4; z++) {
                        cout << "control[" << bw_index << "][" << y << "][" << z << "] :" 
                                << " bw: " << bw_ave[bw_index][y][z] 
                                << " loss: " << loss_ave[bw_index][y][z] 
                                << " rtt: " << rtt_ave[bw_index][y][z] << endl;
                }
                cout << endl;
        }
        return 0;
}
