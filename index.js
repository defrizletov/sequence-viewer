const framesCount = 30, // количество кадров в секвенции
framesContainer = [], // контейнер кадров
sequenceElement = document.querySelector('#sequence'); // html элемент секвенции

// текущий кадр
let currentFrame = 0,
pixelsPerFrame = 0,
currentPixel = 0;

// создание секвенции
function createSequence () {
    // создаем кадры секвенции с помощью цикла
    for (let i = 0; i < framesCount; i++) {
        const el = document.createElement('img');

        el.src = `./assets/images/${i}.png`;

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

    // прячем пред. кадр
    framesContainer[currentFrame].style.display = 'none';

    // изменяем кадр в зависимости от направления movement (-1, 0, 1)
    currentFrame += movement;

    if(currentFrame < 0) currentFrame = framesContainer.length - 1; // если кадр меньше 0, устанавливаем его на последний
    else if(currentFrame >= framesContainer.length) currentFrame = 0; // если кадр больше чем есть, устанавливаем его на первый

    // показываем текущий кадр
    framesContainer[currentFrame].style.display = 'block';
};

function onResize () {
    pixelsPerFrame = Math.floor(document.body.clientWidth / (framesCount * 4));
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

    window.addEventListener('resize', onResize);
};

createSequence(); // создаем секвенцию
onResize();
initEvents(); // инициализируем ивенты