/**
 * Хранение размеров и состояния окна до его разворачивания.
 * @type {Object<number, {width: number, height: number, left: number, top: number, state: string}>}
 */
let originalWindowSize = {};

/**
 * Разворачивает окно на полный экран, сохраняя его текущие размеры и состояние.
 * @param {number} windowId - Идентификатор окна Chrome.
 */
function maximizeWindow(windowId) {
    chrome.windows.get(windowId, (win) => {
        if (win) {
            // Сохраняем оригинальные размеры и состояние, если они еще не сохранены
            if (!originalWindowSize[windowId]) {
                originalWindowSize[windowId] = {
                    width: win.width,
                    height: win.height,
                    left: win.left,
                    top: win.top,
                    state: win.state, // Сохраняем текущее состояние окна
                };
            }

            // Разворачиваем окно только если оно не в состоянии "maximized"
            if (win.state !== "maximized") {
                chrome.windows.update(win.id, { state: "maximized" });
            }
        }
    });
}

/**
 * Восстанавливает размеры и состояние окна, если они были сохранены ранее.
 * @param {number} windowId - Идентификатор окна Chrome.
 */
function restoreWindow(windowId) {
    if (originalWindowSize[windowId]) {
        const { state, ...size } = originalWindowSize[windowId];

        // Восстанавливаем окно только если оно было в состоянии "normal" или другом не "maximized"
        if (state === "normal") {
            chrome.windows.update(windowId, {
                ...size,
                state: "normal", // Восстанавливаем состояние окна
            });
        }

        // Удаляем сохраненные данные, чтобы не сохранять старые размеры
        delete originalWindowSize[windowId];
    }
}

/**
 * Слушатель для открытия DevTools. Разворачивает текущее окно при подключении DevTools
 * и восстанавливает его при отключении.
 */
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "devtools-page") {
        chrome.windows.getCurrent((win) => {
            if (win) {
                maximizeWindow(win.id);
            }
        });

        // Слушатель на отключение DevTools
        port.onDisconnect.addListener(() => {
            chrome.windows.getCurrent((win) => {
                if (win) {
                    restoreWindow(win.id);
                }
            });
        });
    }
});
