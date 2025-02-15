import frames from './low_frames.js'; // кадры низкого качества

const framesContainer = [], // контейнер кадров
sequenceElement = document.querySelector('#sequence'), // html элемент секвенции
frameLoadTimeout = 500, // время ожидания для загрузки кадра лучшего качества
frameFormat = 'webp', // формат кадра
lowQualityFramePrefix = `data:image/${frameFormat};base64,`, // base64 source префикс кадра
framesDir = './assets/images/'; // путь до директории кадров

let currentFrame = 0, // текущий кадр
pixelsPerFrame = 0, // пикселей между кадрами
currentPixel = 0, // текущий пиксель между кадрами
rotateNumber, // большая сторона секвенции для вычислений с пикселями для смены кадров
timeoutId;

// создание секвенции
function createSequence () {
    // создаем кадры секвенции с помощью цикла
    for (let i = 0; i < frames.length; i++) {
        const el = document.createElement('img');

        el.src = `${lowQualityFramePrefix}${frames[i]}`;

        el.style.display = i === 0 ? 'block' : 'none';

        sequenceElement.append(el);

        framesContainer.push(el);
    };

    // меняем кадр на самый первый
    moveFrame(0);
};

// смена кадра
function moveFrame (movement) {
    currentPixel += Math.abs(movement);

    if(currentPixel < pixelsPerFrame) return;
    else currentPixel = 0;

    if(timeoutId) {
        clearTimeout(timeoutId);

        timeoutId = 0;
    };

    // прячем пред. кадр
    framesContainer[currentFrame].style.display = 'none';

    // изменяем кадр в зависимости от направления movement (-1, 0, 1)
    currentFrame += movement;

    if(currentFrame < 0) currentFrame = framesContainer.length - 1; // если кадр меньше 0, устанавливаем его на последний
    else if(currentFrame >= framesContainer.length) currentFrame = 0; // если кадр больше чем есть, устанавливаем его на первый

    // показываем текущий кадр
    const frame = framesContainer[currentFrame];
    frame.style.display = 'block';

    // если текущий кадр является кадром низкого качества, заменим его на кадр лучшего качества через секунду ожидания на этом кадре
    if(frame.getAttribute('src').startsWith('data:')) timeoutId = setTimeout(() => frame.src = `${framesDir}${currentFrame}.${frameFormat}`, frameLoadTimeout);
};

function onResize () {
    // получаем ширину и высоту элемента секвенции
    const { width, height } = sequenceElement.getBoundingClientRect();

    // выбираем большую сторону
    rotateNumber = [width,height].sort()[1];

    // выставляем сколько должно пройти пикселей между каждыми кадрами для смены
    pixelsPerFrame = Math.floor(rotateNumber / (frames.length * 2));
};

// ИНИЦАЛИЗАЦИЯ ГЛАВНЫХ СОБЫТИЙ
function initEvents () {
    let dragging = false, // происходит ли зажатие курсора?
    previousX = 0; // предыдущее значение позиции зажатия курсора

    sequenceElement.addEventListener('pointerup', () => dragging = false); // мышка отжата или убрано касание = убираем зажатие курсора
    sequenceElement.addEventListener('pointerdown', ({ pageX }) => {
        previousX = pageX; // устанавливаем предудыщее значение позиции зажатия курсора на текущее

        dragging = true; // устанавливаем зажатие курсора
    });

    // установка сразу двух типов управления (с помощью мыши и касания)
    ['pointer','touch'].map(type => sequenceElement.addEventListener(`${type}move`, event => {
        if(dragging) {
            let clientX = type === 'touch' ? event.touches[0].pageX : event.pageX, // устанавливаем текущую позицию зажатия курсора в зависимости от типа управления
            currentX = clientX - previousX; // вычисляем направление зажатия курсора

            previousX = clientX; // устанавливаем предудыщее значение позиции зажатия курсора на текущее

            moveFrame(-Math.sign(currentX)); // меняем кадр
        };
    }));

    // вызов при изменении размеров окна
    window.addEventListener('resize', onResize);
};

createSequence(); // создаем секвенцию
onResize();
initEvents(); // инициализируем ивенты