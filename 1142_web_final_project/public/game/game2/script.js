document.addEventListener('DOMContentLoaded', () => {
    // 遊戲狀態：false 代表關(紅燈)，true 代表開(綠燈)
    let switchStates = [false, false, false, false, false, false];
    let lightStates = [false, false, false, false, false, false];

    // 根據你的設計設定的連動邏輯 (陣列索引 0-5 對應燈號 1-6)
    const switchEffects = [
        [0, 2, 4], // 開關 A (idx 0) 控制燈 1, 3, 5
        [1, 2, 3], // 開關 B (idx 1) 控制燈 2, 3, 4
        [0, 3, 5], // 開關 C (idx 2) 控制燈 1, 4, 6
        [1, 4, 5], // 開關 D (idx 3) 控制燈 2, 5, 6
        [1, 3, 5], // 開關 E (idx 4) 控制燈 2, 4, 6
        [0, 1, 2]  // 開關 F (idx 5) 控制燈 1, 2, 3
    ];

    // 取得 DOM 元素
    const switches = document.querySelectorAll('.switch');
    const resetBtn = document.getElementById('reset-btn');
    const blackoutScreen = document.getElementById('blackout-screen');

    // 點擊開關事件
    switches.forEach(sw => {
        sw.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            
            // 1. 切換該開關的狀態與圖片
            switchStates[index] = !switchStates[index];
            this.src = switchStates[index] ? 'switch_ON.jpg' : 'Switch_OFF.jpg';

            // 2. 切換對應的燈泡狀態
            const affectedLights = switchEffects[index];
            affectedLights.forEach(lightIndex => {
                lightStates[lightIndex] = !lightStates[lightIndex];
                
                // 更新燈泡圖片
                const lightImg = document.getElementById(`light-${lightIndex}`);
                lightImg.src = lightStates[lightIndex] ? 'light_green.jpg' : 'light_red.jpg';
            });

            // 3. 檢查是否全綠 (過關條件)
            checkWinCondition();
        });
    });

    // 檢查勝利條件
    function checkWinCondition() {
        const allGreen = lightStates.every(state => state === true);
        if (allGreen) {
            // 延遲一下讓玩家看清楚六個綠燈，然後觸發停電
            setTimeout(() => {
                blackoutScreen.classList.add('active');
                setTimeout(() => {
                    localStorage.setItem('pendingResult', 'success');
                    window.location.href = '/scene';
                }, 1200);
            }, 500);
        }
    }

    // 重新開始遊戲
    resetBtn.addEventListener('click', () => {
        // 重置狀態
        switchStates.fill(false);
        lightStates.fill(false);

        // 重置圖片
        switches.forEach(sw => sw.src = 'Switch_OFF.jpg');
        for(let i = 0; i < 6; i++) {
            document.getElementById(`light-${i}`).src = 'light_red.jpg';
        }

        // 移除黑畫面
        blackoutScreen.classList.remove('active');
    });
});
