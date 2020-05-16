var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');

var g_nLoad = 0;
var imgLoadCount = new Image(); imgLoadCount.onload = function () { g_nLoad++; }; imgLoadCount.src = "js/loadcount.png";
var imgLoadBkg = new Image(); imgLoadBkg.onload = function () { g_nLoad++; }; imgLoadBkg.src = "assets/login.jpg";


var gameIntervalID;
const cUpdateTime = 40;//一秒25張
const c_frametime = 1.0 / cUpdateTime;

///////////////////////mouse////////////////////////////////////////////////////////////////////
var g_mx = 0;
var g_my = 0;
var g_mouseDown = false;

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect(); // abs. size of element
    var scaleX = canvas.width / rect.width;    // relationship bitmap vs. element for X
    var scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for Y

    g_mx = (evt.clientX - rect.left) * scaleX;  // scale mouse coordinates after they have
    g_my = (evt.clientY - rect.top) * scaleY;     // been adjusted to be relative to element
}


function fullscreen() {

    var elem = document.getElementById('canvas');
    if (elem.requestFullscreen) elem.requestFullscreen();
    else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
    else if (elem.mozRequestFullScreen) elem.mozRequestFullScreen();
    else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function BitRow(img, row, w, h, dstx, dsty) { context.drawImage(img, row * w, 0, w, h, dstx, dsty, w, h); }
function Bitblt(img, srcx, srcy, w, h, dstx, dsty) { context.drawImage(img, srcx, srcy, w, h, dstx, dsty, w, h); }
function Bit(img, dstx, dsty) { context.drawImage(img, dstx, dsty); }
function BitBkg(img) { context.drawImage(img, 0, 0); }
function BitColor() {  context.fillStyle = 'rgb(0,0,0)'; context.fillRect(0, 0, canvas.width, canvas.height); }

function HideCursor() { if (canvas.style.cursor != 'none') canvas.style.cursor = 'none'; }
function ShowCursor() { if (canvas.style.cursor != 'auto') canvas.style.cursor = 'auto'; }

function ImgSelNo(_pos, imgsel, imgselno, sel, w) {

    //var img = imgsel;
    for (var i = 0; i < _pos.length; i++) {
        if (sel == i) Bitblt(imgsel, w * i, 0, w, imgsel.height, _pos[i].x, _pos[i].y);
        else Bitblt(imgselno, w * i, 0, w, imgsel.height, _pos[i].x, _pos[i].y);
    }
}

function MouseInRect(ltX, ltY, rbX, rbY) {
    if (g_mx > ltX && g_mx < rbX && g_my > ltY && g_my < rbY) return true;
    return false;
}
function MouseInRcWH(ltX, ltY, w, h) {
    if (g_mx > ltX && g_mx < ltX + w && g_my > ltY && g_my < ltY + h) return true;
    return false;
}


function CreateGame() {
    context.font = "30px 微軟正黑體";
    context.fillStyle = 'rgb(0,0,0)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    //劃載入的畫面
    loadIntervalID = setInterval(Interval_Loading, 100);
}

//劃載入的畫面
var g_rotateAngle = 0;
function DrawLoading() {
	
	BitBkg(imgLoadBkg);
	
	context.fillText("Loading....", canvas.width / 2.5, canvas.height -300);
	
    rotateAndPaintImage(imgLoadCount, canvas.width / 2, canvas.height / 2, g_rotateAngle);
    g_rotateAngle += 10;
}

function rotateAndPaintImage(image, positionX, positionY, angle) {

    var TO_RADIANS = Math.PI / 180;
    var radius = angle * TO_RADIANS;

    //圖片中心點 旋轉
    var axisX = image.width / 2;
    var axisY = image.height / 2;

    context.translate(positionX, positionY);//螢幕畫面位置
    context.rotate(radius);
    context.drawImage(image, -axisX, -axisY);
    context.rotate(-radius);
    context.translate(-positionX, -positionY);
}


function DrawTalk(x, y, words, color, maxWidth) {


    // Bit(imgTalk, (Screen_w - imgTalk.width) / 2, Screen_h - imgTalk.height);

    var lineHeight = 60;
    context.fillStyle = color;
    var line = '';
    for (var n = 0; n < words.length; n++) {
        line += words[n];
        if (line.length >= maxWidth) {
            context.fillText(line, x, y);
            y += lineHeight;
            line = '';
        }
    }
    context.fillText(line, x, y);
}
