// Page transition

const homePage = document.getElementById("home-page");
const gamePage = document.getElementById("game-page");

function showHomePage() {
    gamePage.style.display = "none";
    homePage.style.display = "block";
}

function showGamePage() {
    homePage.style.display = "none";
    gamePage.style.display = "block";
    startNewGame();
}


// Inputs for settings

const inputs = {
    lengthTypeRadios: document.getElementsByName("length-type"),
    fixedLength: document.getElementById("fixed-length"),
    randomLengthMin: document.getElementById("random-length-min"),
    randomLengthMax: document.getElementById("random-length-max"),
    exercisesCount: document.getElementById("exercises-count"),
}


// Handling user inputs for settings

const settings = {
    lengthType: "fixed",
    fixedLength: 5,
    randomLengthMin: 3,
    randomLengthMax: 10,
    exercisesCount: 30,
};

inputs.lengthTypeRadios.forEach(radio => {
    radio.addEventListener("change", event => {
        settings.lengthType = event.target.value;
    });
});

inputs.fixedLength.addEventListener("change", event => {
    settings.fixedLength = parseInt(event.target.value);
});

inputs.randomLengthMin.addEventListener("change", event => {
    settings.randomLengthMin = parseInt(event.target.value);
});

inputs.randomLengthMax.addEventListener("change", event => {
    settings.randomLengthMax = parseInt(event.target.value);
});

inputs.exercisesCount.addEventListener("change", event => {
    settings.exercisesCount = parseInt(event.target.value);
});


// Initial render

inputs.lengthTypeRadios.forEach(radio => {
    if (radio.value === settings.lengthType) {
        radio.checked = true;
    }
});
inputs.fixedLength.value = settings.fixedLength;
inputs.randomLengthMin.value = settings.randomLengthMin;
inputs.randomLengthMax.value = settings.randomLengthMax;
inputs.exercisesCount.value = settings.exercisesCount;

showHomePage();
// showGamePage();


// Game processes

const exercises = {
    _values: [],
    _current: -1,
    hasNext() {
        return this._values[this._current + 1] !== undefined;
    },
    next() {
        this._current++;
        return this._values[this._current];
    },
    clear() {
        this._values = [];
        this._current = -1;
    },
    values() {
        return this._values;
    },
    current() {
        return this._current;
    },
    generate() {
        this.clear();

        [...Array(settings.exercisesCount)].forEach(() => {

            let numberLength = 0;

            if (settings.lengthType === "fixed") {
                numberLength = settings.fixedLength;
            }
            else if (settings.lengthType === "random") {
                numberLength = Math.floor(Math.random() * (settings.randomLengthMax - settings.randomLengthMin) + settings.randomLengthMin);
            }
            else {
                throw new Error(`Unknown length type: ${settings.lengthType}`);
            }

            let strNum = "";
            [...Array(numberLength)].forEach(() => {
                strNum += `${Math.floor(Math.random() * 10)}`;
            });

            this._values.push(strNum);
        });
    }
};

const queue = {
    _window: document.getElementById("queue-window"),
    _dom: document.getElementById("queue"),
    clear() {
        this._dom.remove();
        while (this._dom.firstChild) {
            this._dom.removeChild(this._dom.firstChild);
        }
    },
    fill() {
        exercises.values().forEach(val => {
            const queueItem = document.createElement("div");
            queueItem.classList.add("item");
            queueItem.textContent = val;
            this._dom.prepend(queueItem);
        });
    },
    ready() {
        this._dom.style.bottom = "0";
        this._window.appendChild(this._dom);
        return new Promise((resolve, reject) => {
            this._dom.addEventListener("animationend", resolve)
        });
    },
    next() {
        this._dom.style.bottom = `${-46 * (exercises.current() + 1)}px`;
    }
};

const timer = {
    _dom: document.getElementById("timer"),
    /** @type {Date} */
    _start: null,
    _interval: null,
    reset() {
        this._dom.textContent = "00:00:00.000";
    },
    start() {
        this._start = Date.now();
        this._interval = setInterval(() => {
            const time = new Date(Date.now() - this._start);
            const h = String(time.getUTCHours()).padStart(2, "0");
            const m = String(time.getUTCMinutes()).padStart(2, "0");
            const s = String(time.getUTCSeconds()).padStart(2, "0");
            const ms = String(time.getUTCMilliseconds()).padStart(3, "0");
            this._dom.textContent = `${h}:${m}:${s}.${ms}`;
        }, 33);
    },
    stop() {
        clearInterval(this._interval);
    }
}

const score = {
    _dom: {
        done: document.getElementById("score-done"),
        mistakes: document.getElementById("score-mistakes")
    },
    _mistakes: 0,
    _done: 0,
    clear() {
        this._mistakes = 0;
        this._done = 0;
        this._dom.mistakes.textContent = "0";
        this._dom.done.textContent = "0";
    },
    mistake() {
        this._mistakes++;
        this._dom.mistakes.textContent = this._mistakes;
    },
    done(num) {
        this._done += num;
        this._dom.done.textContent = this._done;
    }
};

const currentBox = {

    _dom: document.getElementById("current-box"),

    /** @type { { container: HTMLElement, chars: HTMLElement[], current: number, mistakes: HTMLElement[] } } */
    _target: null,

    _cursor: document.getElementById("cursor"),

    /** @param {string} value */
    put(value) {

        if (this._target !== null) {
            const ending = this._target.container;
            ending.classList.add("ending");
            ending.addEventListener("animationend", () => ending.remove());
        }

        const targetNumber = document.createElement("div");
        targetNumber.classList.add("target-number");

        const targetCharacters = value.split("").map(char => {
            const targetCharacter = document.createElement("div");
            targetCharacter.classList.add("target-character");
            targetCharacter.textContent = char;
            targetNumber.appendChild(targetCharacter);
            return targetCharacter;
        });

        this._dom.appendChild(targetNumber);

        this._target = {
            container: targetNumber,
            chars: targetCharacters,
            current: 0,
            mistakes: []
        };
    },

    moveCursor() {
        if (this._target === null) {
            this._cursor.style.left = "20px";
        }
        else {
            const start = this._target.chars[0].offsetLeft;
            const charWidth = this._target.chars[0].offsetWidth;
            this._cursor.style.left = `${start + charWidth * this._target.current}px`;
        }
    },

    type(char) {
        if (this._target === null) return;

        if (this._target.chars[this._target.current]?.textContent === char) {
            this._target.chars[this._target.current].classList.add("ok");
        }
        else {
            const mistakeChar = document.createElement("div");
            mistakeChar.classList.add("target-character", "ng");
            mistakeChar.textContent = char;

            this._target.mistakes[this._target.current] = mistakeChar;

            if (this._target.chars[this._target.current] === undefined) {
                this._target.container.appendChild(mistakeChar);
            } else {
                mistakeChar.classList.add("overlap");
                this._target.chars[this._target.current].appendChild(mistakeChar);
            }

            score.mistake();
        }

        this._target.current++;
    },

    backspace() {
        if (this._target === null) return;

        if (this._target.current <= 0) {
            this._target.current = 0;
            return;
        }

        this._target.current--;

        if (this._target.mistakes[this._target.current] !== undefined) {
            this._target.mistakes[this._target.current].remove();
            this._target.mistakes[this._target.current] = undefined;
        }

        if (this._target.chars[this._target.current] !== undefined) {
            this._target.chars[this._target.current].classList.remove("ok");
        }
    },

    isCompleted() {
        return (
            this._target !== null
            && (this._target.chars.length - 1) < this._target.current
            && this._target.mistakes.every(each => each === undefined)
        );
    },

    getCurrentTargetNumberLength() {
        return this._target.chars.length ?? 0;
    },

    clear() {
        if (this._target !== null) {
            this._target.container.remove();
            this._target = null;
        }
    }
}


// Wrappers

const wrapper = document.getElementById("wrapper");
const loadingEffect = document.getElementById("loading");
const countDownEffect = document.getElementById("count-down");

function loading() {
    wrapper.classList.add("show");
    loadingEffect.classList.add("show");
}

function loaded() {
    wrapper.classList.remove("show");
    loadingEffect.classList.remove("show");
}

function countDown() {
    wrapper.classList.add("show");
    countDownEffect.classList.add("show");

    return new Promise((resolve, reject) => {
        function displayNum(num) {
            const element = document.createElement("div");
            element.classList.add("num");
            element.textContent = num;
            countDownEffect.appendChild(element);
            element.addEventListener("animationend", () => {
                element.remove();
                if (num - 1 > 0) {
                    displayNum(num - 1);
                } else {
                    wrapper.classList.remove("show");
                    countDownEffect.classList.remove("show");
                    resolve();
                }
            });
        }
        displayNum(3);
    });
}


function acceptTyping(event) {
    switch (event.key) {
        case "Backspace":
            currentBox.backspace();
            currentBox.moveCursor();
            break;
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
            currentBox.type(event.key);
            currentBox.moveCursor();

            if (currentBox.isCompleted()) {
                score.done(currentBox.getCurrentTargetNumberLength());

                if (exercises.hasNext()) {
                    currentBox.put(exercises.next());
                    currentBox.moveCursor();
                    queue.next();
                }
                else {
                    stopGame();
                    currentBox.put("Congratulations!");
                    currentBox.moveCursor();
                    popConfetti();
                }
            }
            break;
        default:
            // Do nothing
    }
}

async function startNewGame() {

    timer.reset();
    score.clear();

    loading();

    exercises.generate();
    queue.fill();
    await queue.ready();

    loaded();

    currentBox.put(exercises.next());
    currentBox.moveCursor();
    queue.next();

    await countDown();

    timer.start();

    addEventListener("keydown", acceptTyping);
}

function stopGame() {
    removeEventListener("keydown", acceptTyping);
    timer.stop();
    queue.clear();
    currentBox.clear();
}

function retryGame() {
    stopGame();
    startNewGame();
}

function exitGame() {
    stopGame();
    showHomePage();
}

async function popConfetti() {

    // 最大飛距離 px
    const maxDistance = 500;

    // 広がり角度 degree
    const spreadAngle = 100;

    // 紙吹雪の数
    const amount = 70;

    // 角度を半分にしてラジアンに変換。
    const maxRadian = spreadAngle / 2 * Math.PI / 180;

    // 現在の body の大きさから、紙吹雪が飛び始める原点を算出。
    const originLeft = document.body.clientWidth / 2;
    const originTop = document.body.clientHeight / 3 * 2;

    // 紙吹雪を描画するエリア。
    const canvas = document.createElement("div");
    canvas.style.position = "absolute";
    canvas.style.zIndex = "-1000";

    // 紙吹雪が飛びきった(これから落ちていく直前)状態の描画エリアの大きさと位置。
    const canvasWidth = 2 * maxDistance * Math.sin(maxRadian);
    const canvasHeight = maxDistance;
    const canvasLeft = originLeft - canvasWidth / 2;
    const canvasTop = originTop - maxDistance;

    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    canvas.style.left = `${canvasLeft}px`;
    canvas.style.top = `${canvasTop}px`;

    // 紙吹雪を生成。
    [...Array(amount)].map(() => {
        const chip = document.createElement("div");
        chip.style.position = "absolute";
        chip.style.width = "10px";
        chip.style.height = "10px";
        chip.style.borderRadius = "1px";

        // 射出角度(真っ直ぐからどれくらいずれるか)を決定。
        const radian = maxRadian * Math.random();

        // 飛距離を決定。遠くに飛ぶのが多くなるように調整。
        const distance = Math.sin(Math.acos(1 - Math.random())) * maxDistance;

        // 描画エリアにおける left, top を決定。
        const left = canvasWidth / 2 + ((Math.sign(Math.random() - 0.5)) * (distance * Math.sin(radian)));
        const top = canvasHeight - distance * Math.cos(radian);

        // 割合に変換してスタイルに適用。
        chip.style.left = `${left / canvasWidth * 100}%`;
        chip.style.top = `${top / canvasHeight * 100}%`;

        // 色を決定。
        const of3 = Math.floor(Math.random() * 3);
        const of2 = Math.floor(Math.random() * 2);
        const [r, g, b] = [
            of3 === 0 ? 0 : (of3 + 1 + of2) % 3 === 0 ? 255 : Math.floor(Math.random() * 5) * 63.75,
            of3 === 1 ? 0 : (of3 + 1 + of2) % 3 === 1 ? 255 : Math.floor(Math.random() * 5) * 63.75,
            of3 === 2 ? 0 : (of3 + 1 + of2) % 3 === 2 ? 255 : Math.floor(Math.random() * 5) * 63.75
        ];
        chip.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.7)`;

        // ひらひらアニメーション。
        chip.style.transformOrigin = `${Math.random() * 200 - 50}% ${Math.random() * 200 - 50}%`;
        chip.animate({
            transform: ["none", `rotate3d(${Math.random()}, ${Math.random()}, ${Math.random()}, 360deg)`]
        }, {
            duration: Math.random() * 1000 + 500,
            easing: "linear",
            iterations: Infinity
        });

        canvas.appendChild(chip);
    });

    document.body.appendChild(canvas);

    // 発射！描画範囲を広げることで表現。
    await canvas.animate({
        left: [`${originLeft}px`, `${canvasLeft}px`],
        top: [`${originTop}px`, `${canvasTop}px`],
        width: [0, `${canvasWidth}px`],
        height: [0, `${canvasHeight}px`],
        easing: "ease-out"
    }, {
        duration: 300,
        easing: "ease-out",
        fill: "backwards"
    })
    .finished;

    // 落ちてゆく。。。
    await canvas.animate({
        top: [`${canvasTop}px`, `${canvasTop + 500}px`],
        opacity: [1, 0]
    }, {
        duration: 3000,
        easing: "cubic-bezier(0,0,0.1,0)"
    })
    .finished;

    canvas.remove();
}
