document.addEventListener('DOMContentLoaded', () => {
    // 获取按钮元素
const playPauseBtn = document.getElementById('playPauseBtn');
const loadButton = document.getElementById('loadButton');

// 定义一个函数来模拟点击事件
function simulateClick(element) {
    const event = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
    });
    element.dispatchEvent(event);
}

// 定义一个函数来计算到下一个整十秒的时间差
function getNextWholeTenSecondsDelay() {
    const now = new Date();
    const seconds = now.getSeconds();
    const milliseconds = now.getMilliseconds();
    const nextWholeTenSeconds = Math.ceil((seconds + 1) / 10) * 10;
    const delay = (nextWholeTenSeconds - seconds) * 1000 - milliseconds;
    return delay;
}

// 监听加载按钮点击事件
loadButton.addEventListener('click', () => {
    const delay = getNextWholeTenSecondsDelay();
    console.log(`Scheduled to click the button in ${delay} milliseconds`);

    setTimeout(() => {
        simulateClick(playPauseBtn);
        console.log('Button clicked at ' + new Date().toLocaleString());
    }, delay);
});
});