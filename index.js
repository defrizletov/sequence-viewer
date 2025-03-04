//import frames from './low_frames.js'; // кадры низкого качества

const framesContainer = [], // контейнер кадров
sequenceElement = document.querySelector('#sequence'), // html элемент секвенции
frameFormat = 'webp', // формат кадра
lowQualityFramePrefix = `data:image/${frameFormat};base64,`, // base64 source префикс кадра
framesDir = './assets/images/sequence', // путь до директории кадров
frameLoadTimeout = 500, // время ожидания для загрузки кадра лучшего качества
animationStartTimeout = 1000, // время ожидания для старта крутящей анимации
animationDelay = 45, // задержка между сменой кадров анимации
warningElement = document.querySelector('#warning'), // элемент предупреждения об экране устройства
pixelsPerFrame = 2.5, // пикселей между кадрами
pinsContainer = [ // контейнер пинов
    {
        title: 'Тест',
        positions: [[57.89,41.76],[57.97,42.34],[58.02,42.93],[58.04,43.52],[58.04,44.11],[58.03,44.71],[57.99,45.31],[57.93,45.9],[57.85,46.5],[57.74,47.07],[57.61,47.65],[57.46,48.22],[57.29,48.78],[57.09,49.32],[56.87,49.85],[56.65,50.39],[56.39,50.87],[56.11,51.34],[55.82,51.8],[55.51,52.25],[55.17,52.64],[54.84,53.02],[54.47,53.39],[54.11,53.74],[53.71,54.03],[53.33,54.31],[52.91,54.57],[52.49,54.77],[52.08,54.95],[51.62,55.13],[51.2,55.22],[50.76,55.3],[50.31,55.35],[49.87,55.36],[49.43,55.34],[48.99,55.29],[48.55,55.19],[48.12,55.07],null,null,null,null,null,null,null,null,null,null,null,null,[43.43,50.65],[43.18,50.13],[42.96,49.6],[42.76,49.05],[42.58,48.5],[42.41,47.93],[42.28,47.35],[42.16,46.75],[42.08,46.17],[42.01,45.56],[41.96,44.96],[41.94,44.35],[41.95,43.74],[41.97,43.14],[42.02,42.55],[42.09,41.95],[42.18,41.37],[42.29,40.8],[42.42,40.23],[42.57,39.67],[42.75,39.12],[42.94,38.59],[43.16,38.08],[43.39,37.59],[43.64,37.12],[43.9,36.67],[44.18,36.24],[44.48,35.82],[44.79,35.43],[45.1,35.07],[45.44,34.72],[45.79,34.41],[46.15,34.12],[46.51,33.86],[46.88,33.62],[47.27,33.4],[47.66,33.23],[48.06,33.07],[48.46,32.94],[48.86,32.84],[49.26,32.77],[49.65,32.72],[50.04,32.69],[50.44,32.67],[50.98,32.66],[51.21,32.79],[51.4,32.85],[52.07,33.01],[52.42,33.16],[52.81,33.32],[53.2,33.54],[53.58,33.78],[53.95,34.04],[54.3,34.33],[54.65,34.65],[54.97,34.99],[55.3,35.35],[55.6,35.73],[55.9,36.14],[56.18,36.57],[56.44,37.02],[56.69,37.48],[56.92,37.96],[57.13,38.47],[57.33,38.98],[57.51,39.52],[57.67,40.06],[57.82,40.62],[57.93,41.18],[58.03,41.75]]
    }
],
loadingSpan = document.querySelector('#loading');

let currentFrame = 0, // текущий кадр
currentPixel = 0, // текущий пиксель между кадрами
upscaleTimeout, // айди таймаута замены картинки на хорошую
animationTimeout, // айди таймаута крутящей анимации
animationCooldown = animationDelay, // задержка между сменой кадров анимации
animationPlaying = false, // анимация играет?
lastPerformance;

// создание секвенции
async function createSequence () {
    const frames = await new Promise(r => {
        try {
            const xhr = new XMLHttpRequest();

            let total;

            xhr.addEventListener('readystatechange', () => {
                if(xhr.readyState === xhr.HEADERS_RECEIVED) {
                    total = +xhr.getResponseHeader('content-length');

                    xhr.addEventListener('progress', event => loadingSpan.innerText = Math.min(100, Math.floor(event.loaded / total * 100)) + '%');
                };
            });

            xhr.addEventListener('load', () => r(eval(xhr.response)));

            //xhr.responseType = 'json';
    
            //xhr.open('GET', '/low_frames.json');

            xhr.open('GET', './low_frames.js');

            xhr.send();
        } catch (e) {
            console.log('error', e);

            r();
        };
    });

    if(!frames) return loadingSpan.innerText = 'Неизвестная ошибка...';

    document.querySelector('#preloader').remove();

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
    if(upscaleTimeout) {
        clearTimeout(upscaleTimeout);

        upscaleTimeout = 0;
    };

    // прячем пред. кадр
    framesContainer[currentFrame].style.display = 'none';

    // изменяем кадр в зависимости от направления movement (-1, 0, 1)
    currentFrame += movement;

    if(currentFrame < 0) currentFrame = framesContainer.length - 1; // если кадр меньше 0, устанавливаем его на последний
    else if(currentFrame >= framesContainer.length) currentFrame = 0; // если кадр больше чем есть, устанавливаем его на первый

    updatePinPositions(); // обновляем позиции пинов

    // показываем текущий кадр
    const frame = framesContainer[currentFrame];
    frame.style.display = 'block';

    // если текущий кадр является кадром низкого качества, заменим его на кадр лучшего качества через секунду ожидания на этом кадре
    //if(frame.getAttribute('src').startsWith('data:')) timeoutId = setTimeout(() => frame.src = `${framesDir}${currentFrame}.${frameFormat}`, frameLoadTimeout);
};

function onResize () {
    // получаем ширину и высоту элемента секвенции
    const { width, height } = sequenceElement.getBoundingClientRect();

    // если устройство в вертикальном положении, показываем предупреждение
    warningElement.style.display = ['none','flex'][+(height > width)];
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

            currentPixel += Math.abs(currentX); // добавляем пиксели

            // отмена, если пикселей меньше, чем нужно для смены кадра
            if(currentPixel < pixelsPerFrame) return;
        
            currentPixel = 0; // сбрасываем пиксели

            // если есть таймаут анимации
            if(animationTimeout) {
                clearTimeout(animationTimeout); // убираем запущенный таймаут
        
                animationTimeout = 0; // точно очищаем запущенный таймаут
        
                animationPlaying = false; // анимация секвенции не играет
            };

            // устанавливаем таймаут для крутящей анимации секвенции
            animationTimeout = setTimeout(() => {
                animationPlaying = true; // анимация играет.

                lastPerformance = performance.now(); // устанавливаем последнее время кадра на текущее

                requestAnimationFrame(animateSequence); // запрашиваем анимирование секвенции
            }, animationStartTimeout);

            moveFrame(-Math.sign(currentX)); // меняем кадр
        };
    }));

    let menuOpened = false; // открыто ли меню? по умолчанию - нет

    const menuButton = document.querySelector('#menuButton'), // кнопка навигации
    [menuText, menuImg] = menuButton.children, // текст и иконка кнопки навигации
    menuOverlay = document.querySelector('#menuOverlay'), // сам оверлей меню
    menuButtons = [...document.querySelector('.buttons').children]; // кнопки в меню

    menuButton.addEventListener('click', () => {
        menuOpened = !menuOpened; // закрыть или открыть меню?

        menuText.innerText = menuOpened ? 'Закрыть' : 'Генплан'; // меняем текст внутри кнопки навигации
        menuImg.setAttribute(
            'src',
            menuImg.getAttribute('src').replace(
                menuOpened ? 'menu' : 'close',
                menuOpened ? 'close' : 'menu'
            )
        ); // меняем иконку внутри кнопки навигации

        menuOverlay.style.display = menuOpened ? 'flex' : 'none'; // показываем или прячем меню
    });

    let selectedButton = 0; // выбранная кнопка, по умолчанию 0 - первая

    // находим все кнопки в меню и добавляем к ним обработчик клика
    menuButtons.map((el, i) => el.addEventListener('click', () => {
        if(selectedButton === i) return; // ничего не делать, если нажата та же кнопка в меню

        menuButtons[selectedButton].classList.remove('selected'); // удаляем у текущей выбранной кнопки класс selected

        selectedButton = i; // устанавливаем выбранную кнопку

        el.classList.add('selected'); // добавляем выбранной кнопке класс selected
    }));

    // вызов при изменении размеров окна
    window.addEventListener('resize', onResize);
};

// создание пинов
function createPins () {
    const uiElement = document.querySelector('#ui'); // получаем ui

    // проходим по массиву с пинами и достаем title из каждого
    pinsContainer.map(({ title }) => {
        const pin = document.createElement('div'); // создаем сам пин

        pin.className = 'pin'; // устанавливаем ему нужный класс

        const text = document.createElement('span'); // создаем текст пина
        text.innerText = title; // устанавливаем текст
        pin.append(text); // добавляем текст внутрь пина

        uiElement.append(pin); // добавляем сам пин в ui
    });

    updatePinPositions(); // после создания всех пинов, сразу располагаем их в нужные позиции
};

// обновление позиции пинов
function updatePinPositions () {
    // берем все элементы с классом pin
    [...document.querySelectorAll('.pin')].map((pin, index) => {
        const pinPositions = pinsContainer[index].positions[currentFrame]; // достаем нужный пин по индексу из контейнера пинов и сразу его позицию в соответствии с текущим кадром

        pin.style.display = pinPositions ? 'flex' : 'none'; // если позиции для пина на этом кадре есть, покажем, иначе спрячем

        // если есть позиции для пина на текущем кадре
        if(pinPositions) {
            pin.style.left = `${pinPositions[0]}%`; // устанавливаем позицию x
            pin.style.top = `${pinPositions[1]}%`; // устанавливаем позицию y
        };
    });
};

// анимация секвенции
function animateSequence (now) {
    // если анимация играет, снова вызвать эту функцию сразу как браузер сможет ее обработать
    if(animationPlaying) requestAnimationFrame(animateSequence);

    const delta = now - lastPerformance; // вычисляем дельту - пройденное время между последним и текущим кадрами

    lastPerformance = now; // устанавливаем время кадра

    animationCooldown -= delta; // отнимаем от кулдауна смены кадра на следующий дельту

    // если кулдаун меньше или равен 0, то меняем кадр на следующий (создаем анимацию прокрута)
    if(animationCooldown <= 0) {
        moveFrame(1); // двигаем кадр вперед на 1

        animationCooldown = animationDelay; // устанавливаем кулдаун анимации снова
    };
};

await createSequence(); // создаем секвенцию
createPins(); // создаем пины
onResize();
initEvents(); // инициализируем ивенты

sequenceElement.addEventListener('click', ({ x, y }) => {
    console.log(x, y, x / window.innerWidth, y / window.innerHeight);
});