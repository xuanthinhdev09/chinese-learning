/**
 * Simple Navigation Script cho bt-demo project
 * Thêm click handlers vào existing menu items
 */

(function() {
    'use strict';

    // File mapping: tab name → filename
    const FILE_MAPPING = {
        // Main tabs (có file thực tế)
        '正码过关': '正码过关.html',
        '正码特': '正码特.html',
        '正码1-6': '正码1-6.html',
        '连肖连尾': '连肖连尾.html',
        '自选不中': '自选不中.html',
        '合肖': '合肖.html',
        '中一': '中一.html',
        // Tabs với sub-tabs (default đến sub-tab đầu)
        '七码五行': '七码五行-七码.html',
        '尾数': '尾数-头尾数.html',
        // Sub-tabs for 七码五行
        '七码': '七码五行-七码.html',
        '五行': '七码五行-五行.html',
        // Sub-tabs for 尾数
        '头尾数': '尾数-头尾数.html',
        '正特尾数': '尾数-正特尾数.html',
        // Sub-tabs for 正码1-6 (chúng ở trong 正码1-6.html file)
        '正一特': '正码1-6.html',
        '正二特': '正码1-6.html',
        '正三特': '正码1-6.html',
        '正四特': '正码1-6.html',
        '正五特': '正码1-6.html',
        '正六特': '正码1-6.html',
        // Sub-tabs for 连肖连尾
        '四连肖': '连肖连尾.html',
        '二连肖': '连肖连尾.html',
        '三连肖': '连肖连尾.html',
        '五连肖': '连肖连尾.html',
        '二连尾': '连肖连尾.html',
        '三连尾': '连肖连尾.html',
        '四连尾': '连肖连尾.html',
        '五连尾': '连肖连尾.html'
    };

    /**
     * Navigate đến target file
     */
    function navigateTo(tabName) {
        const targetFile = FILE_MAPPING[tabName];
        if (targetFile) {
            window.location.href = targetFile;
        }
    }

    /**
     * Thêm click handlers vào existing menu items
     */
    function addClickHandlers() {
        // Main tabs
        const mainTabs = document.querySelectorAll('.tab-item');
        mainTabs.forEach(tab => {
            const tabName = tab.textContent.trim();
            if (FILE_MAPPING[tabName] && !tab.hasAttribute('data-nav-added')) {
                tab.style.cursor = 'pointer';
                tab.addEventListener('click', function(e) {
                    e.preventDefault();
                    navigateTo(tabName);
                });
                tab.setAttribute('data-nav-added', 'true');
            }
        });

        // Sub-tabs
        const subTabs = document.querySelectorAll('.sub-tab-item');
        subTabs.forEach(tab => {
            const tabName = tab.textContent.trim();
            if (FILE_MAPPING[tabName] && !tab.hasAttribute('data-nav-added')) {
                tab.style.cursor = 'pointer';
                tab.addEventListener('click', function(e) {
                    e.preventDefault();
                    navigateTo(tabName);
                });
                tab.setAttribute('data-nav-added', 'true');
            }
        });
    }

    /**
     * Auto-navigation: tự động click active tab if needed
     */
    function autoSetActiveTab() {
        const currentFile = window.location.pathname.split('/').pop();

        // Find matching tab and mark as active
        const allTabs = document.querySelectorAll('.tab-item, .sub-tab-item');
        allTabs.forEach(tab => {
            const tabName = tab.textContent.trim();
            const expectedFile = FILE_MAPPING[tabName];

            if (expectedFile === currentFile) {
                tab.classList.add('active');
            } else if (expectedFile && currentFile.includes(tabName.replace(/[^\w\s-]/g, ''))) {
                // Partial match for complex cases
                tab.classList.add('active');
            }
        });
    }

    /**
     * Initialize navigation
     */
    function initNavigation() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                addClickHandlers();
                autoSetActiveTab();
            });
        } else {
            addClickHandlers();
            autoSetActiveTab();
        }
    }

    // Export for external use
    window.BTNavigation = {
        navigateTo: navigateTo,
        addHandlers: addClickHandlers,
        init: initNavigation
    };

    // Auto initialize
    initNavigation();

})();