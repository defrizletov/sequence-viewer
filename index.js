//import frames from './low_frames.js'; // кадры низкого качества

const framesContainer = [], // контейнер кадров
sequenceElement = document.querySelector('#sequence'), // html элемент секвенции
frameFormat = 'webp', // формат кадра
lowQualityFramePrefix = `data:image/${frameFormat};base64,`, // base64 source префикс кадра
framesDir = './assets/images/', // путь до директории кадров
frameLoadTimeout = 500, // время ожидания для загрузки кадра лучшего качества
warningElement = document.querySelector('#warning'), // элемент предупреждения об экране устройства
pixelsPerFrame = 2.5, // пикселей между кадрами
pinsContainer = [ // контейнер пинов
    {
        title: '1',
        x: 0.6,
        y: 0.25
    },
    {
        title: 'test',
        x: 0.5,
        y: 0.5
    },
    {
        title: '1337',
        x: 0.37,
        y: 0.56
    }
],
loadingSpan = document.querySelector('#loading');

let currentFrame = 0, // текущий кадр
currentPixel = 0, // текущий пиксель между кадрами
timeoutId;

// создание секвенции
async function createSequence () {
    const frames = await new Promise(r => {
        try {
            const xhr = new XMLHttpRequest();
        
            //xhr.responseType = 'json';
    
            //xhr.open('GET', '/low_frames.jsoя', false);
            xhr.open('GET', './low_frames.js', false);
        
            xhr.onload = () => r(eval(xhr.response));
            
            xhr.onprogress = function (event) {
                console.log(event);
    
                loadingSpan.innerText = Math.floor(event.loaded / event.total * 100) + '%';
            };
              
            xhr.onerror = function() {
                console.log("Запрос не удался");
    
                r();
            };
        
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
    currentPixel += Math.abs(movement);

    if(currentPixel < pixelsPerFrame) return;

    currentPixel = 0;

    if(timeoutId) {
        clearTimeout(timeoutId);

        timeoutId = 0;
    };

    // прячем пред. кадр
    framesContainer[currentFrame].style.display = 'none';

    // изменяем кадр в зависимости от направления movement (-1, 0, 1)
    currentFrame += movement;

    angle += speed * movement;
    
    updatePinPositions();

    if(currentFrame < 0) currentFrame = framesContainer.length - 1; // если кадр меньше 0, устанавливаем его на последний
    else if(currentFrame >= framesContainer.length) currentFrame = 0; // если кадр больше чем есть, устанавливаем его на первый

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

            moveFrame(-Math.sign(currentX)); // меняем кадр
        };
    }));

    // вызов при изменении размеров окна
    window.addEventListener('resize', onResize);
};

function createPins () {
    const uiElement = document.querySelector('#ui');

    pinsContainer.map(({ title, x, y }) => {
        const pin = document.createElement('div');

        pin.className = 'pin';
        pin.innerText = title;
        pin.setAttribute('data-x', x);
        pin.setAttribute('data-y', y);

        uiElement.append(pin);
    });

    updatePinPositions();
};

const radius = 200;
const centerX = sequenceElement.offsetWidth / 2;
const centerY = sequenceElement.offsetHeight / 2;
let angle = 0;
const speed = 3;

function updatePinPositions () {
    const pins = document.querySelectorAll('.pin');
    const image = document.querySelector('#sequence img');
    const imageWidth = image.clientWidth;
    const imageHeight = image.clientHeight;
  
    pins.forEach((pin, index) => {
        // const xPos = parseFloat(pin.getAttribute('data-x')),
        // yPos = parseFloat(pin.getAttribute('data-y')),

        // radians = (angle * Math.PI) / 180,
        // cos = Math.cos(radians),
        // sin = Math.sin(radians),
        // x = centerX + radius * cos + xPos * cos,
        // y = centerY + radius * sin + yPos * sin;

        // pin.style.left = `${x}px`;
        // pin.style.top = `${y}px`;
        const x = parseFloat(pin.dataset.x);
        const y = parseFloat(pin.dataset.y);
        const rad = (angle * Math.PI) / 180;
        const newX = Math.cos(rad) * (x - 0.5) - Math.sin(rad) * (y - 0.5) + 0.5 + 50;
        const newY = Math.sin(rad) * (x - 0.5) + Math.cos(rad) * (y - 0.5) + 0.5 + 50;
        pin.style.left = `${newX}%`;
        pin.style.top = `${newY}%`;
    });
};

/*const x = parseFloat(pin.dataset.x);
const y = parseFloat(pin.dataset.y);
const angle = currentRotation * (Math.PI / 180);
const newX = Math.cos(angle) * (x - 0.5) - Math.sin(angle) * (y - 0.5) + 0.5;
const newY = Math.sin(angle) * (x - 0.5) + Math.cos(angle) * (y - 0.5) + 0.5;
pin.style.left = `${newX * 100}%`;
pin.style.top = `${newY * 100}%`;*/

await createSequence(); // создаем секвенцию
createPins(); // создаем пины
onResize();
initEvents(); // инициализируем ивенты

sequenceElement.addEventListener('click', ({ x, y }) => {
    console.log(x, y, x / window.innerWidth, y / window.innerHeight);
});