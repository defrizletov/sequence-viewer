const framesCount = 30, // количество кадров в секвенции
framesContainer = [], // контейнер кадров
sequenceElement = document.querySelector('#sequence'); // html элемент секвенции

// текущий кадр
let currentFrame = 0;

// создание секвенции
function createSequence () {
    // создаем кадры секвенции с помощью цикла
    for (let i = 0; i < framesCount; i++) {
        const el = document.createElement('img');

        el.src = `./assets/images/${i}.png`;

        el.style.display = 'none';

        sequenceElement.append(el);

        framesContainer.push(el);
    };

    // меняем кадр на самый первый
    moveFrame(0);
};

// смена кадра
function moveFrame (movement) {
    // прячем пред. кадр
    framesContainer[currentFrame].style.display = 'none';

    // изменяем кадр в зависимости от направления movement (-1, 0, 1)
    currentFrame += movement;

    if(currentFrame < 0) currentFrame = framesContainer.length - 1; // если кадр меньше 0 устанавливаем его на последний
    else if(currentFrame >= framesContainer.length) currentFrame = 0; // если кадр больше чем есть устанавливаем его на первый

    // показываем текущий кадр
    framesContainer[currentFrame].style.display = 'block';
};

// ИНИЦАЛИЗАЦИЯ ГЛАВНЫХ СОБЫТИЙ
function initEvents () {
    let dragging = false, // происходит ли драгинг?
    previousX = 0; // предыдущее значение позиции драга

    sequenceElement.addEventListener('pointerup', () => dragging = false); // мышка отжата или убрано касание = убираем драгинг
    sequenceElement.addEventListener('pointerdown', ({ pageX }) => {
        previousX = pageX; // устанавливаем предудыщее значение позиции драга на текущее

        dragging = true; // устанавливаем драгинг
    });

    // установка сразу двух типов управления (с помощью мыши и касания)
    ['pointer','touch'].map(type => sequenceElement.addEventListener(`${type}move`, event => {
        if(dragging) {
            let clientX = type === 'touch' ? event.touches[0].pageX : event.pageX, // устанавливаем текущую позицию драгинга в зависимости от типа управления
            currentX = clientX - previousX; // вычисляем направление драгинга

            previousX = clientX; // устанавливаем предудыщее значение позиции драга на текущее

            moveFrame(-Math.sign(currentX)); // меняем кадр
        };
    }));
};

createSequence(); // создаем секвенцию
initEvents(); // инициализируем ивенты