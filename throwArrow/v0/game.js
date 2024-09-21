var svg = document.querySelector("svg");
var cursor = svg.createSVGPoint();
var arrows = document.querySelector(".arrows");
var randomAngle = 0;
var target = {
    x: 900,
    y: 249.5,
    element: null
};

function updateTargetSize() {
    const size = difficultySettings[currentDifficulty].targetSize;
    if (target.element) {
        target.element.setAttribute('r', size);
    }
}
var lineSegment = {
	x1: 875,
	y1: 280,
	x2: 925,
	y2: 220
};
var pivot = {
	x: 100,
	y: 250
};
aim({
	clientX: 320,
	clientY: 300
});
window.addEventListener("mousedown", draw);
let arrowsThrown = 0;
let successfulHits = 0;

function updateCounter() {
    const counterElement = document.getElementById('hit-counter');
    if (counterElement) {
        counterElement.textContent = `Hits: ${successfulHits} / ${arrowsThrown}`;
    }
}

var gameArea = document.getElementById("game-area");
gameArea.addEventListener("mousedown", draw);

function draw(e) {
    randomAngle = (Math.random() * Math.PI * 0.03) - 0.015;
    TweenMax.to(".arrow-angle use", 0.3, {
        opacity: 1
    });
    gameArea.addEventListener("mousemove", aim);
    gameArea.addEventListener("mouseup", loose);
    aim(e);
}

function aim(e) {
	var point = getMouseSVG(e);
	point.x = Math.min(point.x, pivot.x - 7);
	point.y = Math.max(point.y, pivot.y + 7);
	var dx = point.x - pivot.x;
	var dy = point.y - pivot.y;
	var angle = Math.atan2(dy, dx) + randomAngle;
	var bowAngle = angle - Math.PI;
	var distance = Math.min(Math.sqrt((dx * dx) + (dy * dy)), 50);
	var scale = Math.min(Math.max(distance / 30, 1), 2);
	TweenMax.to("#bow", 0.3, {
		scaleX: scale,
		rotation: bowAngle + "rad",
		transformOrigin: "right center"
	});
	var arrowX = Math.min(pivot.x - ((1 / scale) * distance), 88);
	TweenMax.to(".arrow-angle", 0.3, {
		rotation: bowAngle + "rad",
		svgOrigin: "100 250"
	});
	TweenMax.to(".arrow-angle use", 0.3, {
		x: -distance
	});
	TweenMax.to("#bow polyline", 0.3, {
		attr: {
			points: "88,200 " + Math.min(pivot.x - ((1 / scale) * distance), 88) + ",250 88,300"
		}
	});

	var radius = distance * 9;
	var offset = {
		x: (Math.cos(bowAngle) * radius),
		y: (Math.sin(bowAngle) * radius)
	};
	var arcWidth = offset.x * 3;

	TweenMax.to("#arc", 0.3, {
		attr: {
			d: "M100,250c" + offset.x + "," + offset.y + "," + (arcWidth - offset.x) + "," + (offset.y + 50) + "," + arcWidth + ",50"
		},
			autoAlpha: distance/60
	});

}

function loose() {
    arrowsThrown++;
    updateCounter();
    gameArea.removeEventListener("mousemove", aim);
    gameArea.removeEventListener("mouseup", loose);

    TweenMax.to("#bow", 0.4, {
        scaleX: 1,
        transformOrigin: "right center",
        ease: Elastic.easeOut
    });

    TweenMax.to("#bow polyline", 0.4, {
        attr: {
            points: "88,200 88,250 88,300"
        },
        ease: Elastic.easeOut
    });

    var newArrow = document.createElementNS("http://www.w3.org/2000/svg", "use");
    newArrow.setAttributeNS('http://www.w3.org/1999/xlink', 'href', "#arrow");
    arrows.appendChild(newArrow);

    gsap.to(newArrow, {
        duration: 0.5,
        motionPath: {
            path: "#arc",
            align: "#arc",
            autoRotate: true
        },
        onUpdate: hitTest,
        onComplete: onMiss,
        ease: "none"
    });

    TweenMax.to("#arc", 0.3, {
        opacity: 0
    });
    
    TweenMax.set(".arrow-angle use", {
        opacity: 0
    });
}

function hitTest() {
    var arrow = this.targets()[0];
    if (!arrow || !(arrow instanceof SVGElement)) {
        console.error('Arrow element not found or invalid');
        return;
    }

    var arrowBounds = arrow.getBoundingClientRect();
    var targetX = target.x;
    var targetY = target.y;
    var svg = document.querySelector('svg');
    var pt = svg.createSVGPoint();
    pt.x = targetX;
    pt.y = targetY;
    var targetPoint = pt.matrixTransform(svg.getScreenCTM());
    var hitAreaSize = difficultySettings[currentDifficulty].hitAreaSize;
    var targetBounds = {
        left: targetPoint.x - hitAreaSize / 2,
        right: targetPoint.x + hitAreaSize / 2,
        top: targetPoint.y - hitAreaSize / 2,
        bottom: targetPoint.y + hitAreaSize / 2
    };

    if (!(arrowBounds.right < targetBounds.left || 
          arrowBounds.left > targetBounds.right || 
          arrowBounds.bottom < targetBounds.top || 
          arrowBounds.top > targetBounds.bottom)) {
        this.pause();
        
        successfulHits++;
        updateCounter();
        var arrowCenterX = (arrowBounds.left + arrowBounds.right) / 2;
        var arrowCenterY = (arrowBounds.top + arrowBounds.bottom) / 2;
        
        var dx = arrowCenterX - targetPoint.x;
        var dy = arrowCenterY - targetPoint.y;
        var distance = Math.sqrt((dx * dx) + (dy * dy));
        
        var selector = distance < 10 ? ".bullseye" : ".hit";
        showMessage(selector);
        
        console.log("Hit detected! Distance from center:", distance);
    }
}

document.getElementById('menuButton').addEventListener('click', function () {
    document.getElementById('dropdownMenu').classList.toggle('open');
});



let currentDifficulty = 'medium';
const difficultySettings = {
    easy: { targetSize: 40, hitAreaSize: 30 },
    medium: { targetSize: 30, hitAreaSize: 20 },
    hard: { targetSize: 20, hitAreaSize: 10 }
};

function changeDifficulty(difficulty) {
    currentDifficulty = difficulty;
    updateTargetSize();
    resetGame();
}


function onMiss() {
	showMessage(".miss");
}

function showMessage(selector) {
    gsap.killTweensOf(selector);
    gsap.killTweensOf(selector + " *");  // Kill tweens of children
    gsap.set(selector, {
        autoAlpha: 1
    });
    
    gsap.fromTo(selector + " path", 
        {
            rotation: -5,
            scale: 0,
            transformOrigin: "center"
        },
        {
            duration: 0.5,
            scale: 1,
            stagger: 0.05,
            ease: "back.out"
        }
    );
    
    gsap.to(selector + " path", {
        duration: 0.3,
        rotation: 20,
        scale: 0,
        ease: "back.in",
        delay: 2,
        stagger: 0.03
    });
}



function getMouseSVG(e) {
	cursor.x = e.clientX;
	cursor.y = e.clientY;
	return cursor.matrixTransform(svg.getScreenCTM().inverse());
}

function getIntersection(segment1, segment2) {
	var dx1 = segment1.x2 - segment1.x1;
	var dy1 = segment1.y2 - segment1.y1;
	var dx2 = segment2.x2 - segment2.x1;
	var dy2 = segment2.y2 - segment2.y1;
	var cx = segment1.x1 - segment2.x1;
	var cy = segment1.y1 - segment2.y1;
	var denominator = dy2 * dx1 - dx2 * dy1;
	if (denominator == 0) {
		return null;
	}
	var ua = (dx2 * cy - dy2 * cx) / denominator;
	var ub = (dx1 * cy - dy1 * cx) / denominator;
	return {
		x: segment1.x1 + ua * dx1,
		y: segment1.y1 + ua * dy1,
		segment1: ua >= 0 && ua <= 1,
		segment2: ub >= 0 && ub <= 1
	};
}

const difficultyContainer = document.createElement('div');
    difficultyContainer.id = 'difficulty-container';
    ['easy', 'medium', 'hard'].forEach(diff => {
        const button = document.createElement('button');
        button.textContent = diff.charAt(0).toUpperCase() + diff.slice(1);
        button.onclick = () => changeDifficulty(diff);
        difficultyContainer.appendChild(button);
    });