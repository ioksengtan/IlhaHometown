var imgMap;
var imgPlayer = new Image(); imgPlayer.onload = function () { }; imgPlayer.src = "assets/protagonist.png";


const Screen_w = canvas.width;
const Screen_h = canvas.height;

const SCREEN_LOAD = 0;
const SCREEN_GAME = 1;
const SCREEN_DIALOG = 2;
const SCREEN_PAGE = 3;
var m_screen = SCREEN_LOAD;

//0:up, 1:
var Player = { srcx: 0, srcy: 0, destx: 0, desty: 0, img: null, dir: 0, frame: 0, frametime: 0 };
var NpcRole = [];
var VirualScreen = { srcx: 0, srcy: 0 };


////////////////////////////////////////////////////////////////////////////////////////////////////////////

function OnLoad() {

    CreateGame();

    Player.img = imgPlayer;

    //for (var i = 0; i < 2; i++) { imgNpc[i] = new Image(); imgNpc[i].onload = function () { g_nLoad++; }; imgNpc[i].src = 'assets/dynamic_' + (i + 1) + '.png'; }

    var canvas = document.getElementById('canvas');
    canvas.addEventListener("mousemove", onMouseMove, false);
    canvas.addEventListener("mousedown", onMouseDown, false);
    canvas.addEventListener("mouseup", onMouseUp, false);

    LoadMap(1);

    var oDiv = document.getElementById('dialog');
    oDiv.addEventListener("click", DialogClick, false);

    oDiv = document.getElementById('page');
    oDiv.addEventListener("click", DialogClick, false);

    ShowDialog(false);
    ShowPage(false);
}

function OnResize() {
    console.log(canvas.scrollWidth);

    var div = document.getElementById('dialog'); div.style.width = canvas.scrollWidth * 0.9 + "px";
    div = document.getElementById('page'); div.style.width = canvas.scrollWidth * 0.8 + "px";
}

function InsertDialog(params) { var div = document.getElementById('dialog'); div.scrollTop = 0; div.innerHTML = params; }
function ShowDialog(bs) { var x = document.getElementById('dialog'); if (bs == true) x.style.display = "block"; if (bs == false) x.style.display = "none"; }

function InsertPage(params) { var div = document.getElementById('page'); div.scrollTop = 0; div.innerHTML = params; }
function ShowPage(bs) { var x = document.getElementById('page'); if (bs == true) x.style.display = "block"; if (bs == false) x.style.display = "none"; }

var g_loading_ok = false;

function LoadMap(mapid) {

    m_screen = SCREEN_LOAD;
    g_loading_ok = false;

    ShowDialog(false);
    ShowPage(false);
    m_curDialog = 0;
    Player.dir = 0;


    imgMap = new Image(); imgMap.onload = function () {
        //g_nLoad++;
        Player.srcx = imgMap.width / 2;
        Player.srcy = imgMap.height / 2;
        Player.destx = Player.srcx;
        Player.desty = Player.srcy;

        VirualScreen.srcx = Player.srcx - Screen_w / 2;
        VirualScreen.srcy = Player.srcy - Screen_h / 2;

    }; imgMap.src = "assets/map_" + mapid + ".jpg";

    LoadNPC(mapid);
}

function LoadNPC(mapid) {
    const appNPC = "https://script.google.com/macros/s/AKfycbwizQf7mya2HaafWlX9nVC7aCROlrSB-Bt9LPJ7DepeBJ5etcb6/exec";

    var npc_sets = [];
    NpcRole = [];


    $.get(appNPC, {
        "map_id": mapid,
        "command": "GetNPCsFromMapID"
    }, function (data) {
        npc_sets = parse_data(data);    //console.log(npc_sets.length);

        for (var i = 0; i < npc_sets.length; i++) {

            NpcRole[i] = new Array();

            NpcRole[i].dialog = npc_sets[i].dialog;
            NpcRole[i].npc_description = npc_sets[i].npc_description;
            NpcRole[i].range = Number(npc_sets[i].range) * 48;
            NpcRole[i].map_offset_x = Number(npc_sets[i].map_offset_x) * 48;
            NpcRole[i].map_offset_y = Number(npc_sets[i].map_offset_y) * 48;
            //建築物
            NpcRole[i].build_offx = Number(npc_sets[i].offset_x) * 48;
            NpcRole[i].build_offy = Number(npc_sets[i].offset_y) * 48;
            NpcRole[i].build_w = Number(npc_sets[i].path_end_x) * 48;
            NpcRole[i].build_h = Number(npc_sets[i].path_end_y) * 48;

            //人物來回移動的另一點
            NpcRole[i].path_end_x = Number(npc_sets[i].path_end_x) * 48;
            NpcRole[i].path_end_y = Number(npc_sets[i].path_end_y) * 48;

            //字串
            NpcRole[i].path = npc_sets[i].path;
            NpcRole[i].type = npc_sets[i].type;
            NpcRole[i].event_type = npc_sets[i].event_type;

            NpcRole[i].dir = 0;
            NpcRole[i].frame = 0;//第幾張
            NpcRole[i].frametime = 0;
            //螢幕上地圖位置
            NpcRole[i].srcx = Number(npc_sets[i].map_offset_x) * 48;
            NpcRole[i].srcy = Number(npc_sets[i].map_offset_y) * 48;

            NpcRole[i].waypointX = 0; NpcRole[i].waypointY = 0;
            if (npc_sets[i].path == 'cruise') { //人物來回移動的另一點
                NpcRole[i].waypointX = NpcRole[i].path_end_x;
                NpcRole[i].waypointY = NpcRole[i].path_end_y;
            }
            else if (npc_sets[i].path == 'random') { RandomRoleWaypointXY(NpcRole[i]); }

            var pic = 'assets/' + npc_sets[i].type + "_" + npc_sets[i].npc_id + ".png";
            var img = new Image(); img.onload = function () { g_nLoad++; }; img.src = pic;
            NpcRole[i].img = new Image(); NpcRole[i].img = img;


            //console.log(npc_sets[i].dialog);
        }
    })
        //載入完成
        .done(function () { g_loading_ok = true; })
}



//產生 +-r 之間的數
function RandomR(r) {
    var p = Math.floor(Math.random() * r);
    var r = Math.floor(Math.random() * 2); if (r == 0) p = -p;
    return p;
}

function RandomRoleWaypointXY(Role) {
    var x = RandomR(Role.range);
    var y = RandomR(Role.range);
    Role.waypointX = Role.map_offset_x + x;
    Role.waypointY = Role.map_offset_y + y;
    //console.log("way ponit " + Role.waypointX + ";" + Role.waypointY);
}

function RoleFrame(role) {
    role.frametime += c_frametime * 10;
    if (role.frametime >= 1) {
        role.frame++; if (role.frame > 2) role.frame = 0;
        role.frametime -= 1;
    }
}

function PickNPC() {
    //console.log("mx" + g_mx + " my" + g_my);
    if (m_screen == SCREEN_GAME) {

        for (var i = 0; i < NpcRole.length; i++) {
            var x = NpcRole[i].srcx - VirualScreen.srcx;
            var y = NpcRole[i].srcy - VirualScreen.srcy;
            if (NpcRole[i].type == 'static' && MouseInRcWH(x, y, NpcRole[i].build_w, NpcRole[i].build_h)) return i;
            if (NpcRole[i].type == 'dynamic' && MouseInRcWH(x, y, 48, 48)) return i;
        }
    }
    return -1;
}

function DrawPlayer(npc) {
    var gy = npc.dir * 48;
    Bitblt(npc.img, npc.frame * 48, gy, 48, 48, npc.srcx - VirualScreen.srcx, npc.srcy - VirualScreen.srcy);
}

function DrawNpc(npc) {
    //建築物
    if (npc.type == 'static') {
        Bitblt(npc.img, npc.build_offx, npc.build_offy, npc.build_w, npc.build_h, npc.srcx - VirualScreen.srcx, npc.srcy - VirualScreen.srcy);
    }
    //人物
    else if (npc.type == 'dynamic') { DrawPlayer(npc); }
}

function ChgRoleDirX(role, destx) { if (destx > role.srcx) role.dir = 2; else role.dir = 1; role.srcx = destx; }
function ChgRoleDirY(role, desty) { if (desty > role.srcy) role.dir = 0; else role.dir = 3; role.srcy = desty; }

function RoleMove(role) {
    const speed = 1;
    if (role.type == 'dynamic') {
        switch (role.path) {
            case 'fixed': break;
            case 'cruise': //兩點來回走動NPC
                var ox = role.waypointX - role.srcx;
                var oy = role.waypointY - role.srcy;
                if (Math.abs(ox) > speed) { ChgRoleDirX(role, role.srcx + Math.sign(ox) * speed); }
                else if (Math.abs(oy) > speed) { ChgRoleDirY(role, role.srcy + Math.sign(oy) * speed); }
                else {
                    if (role.waypointX == role.path_end_x && role.waypointY == role.path_end_y) {
                        role.waypointX = role.map_offset_x;
                        role.waypointY = role.map_offset_y;
                    }
                    else {
                        role.waypointX = role.path_end_x;
                        role.waypointY = role.path_end_y;
                    }
                }
                break;
            //隨機
            case 'random':
                var ox = role.waypointX - role.srcx;
                var oy = role.waypointY - role.srcy;
                if (Math.abs(ox) > speed) { ChgRoleDirX(role, role.srcx + Math.sign(ox) * speed); }
                else if (Math.abs(oy) > speed) { ChgRoleDirY(role, role.srcy + Math.sign(oy) * speed); }
                else {
                    RandomRoleWaypointXY(role);
                }
                break;// range
        }
    }
}

var m_pickRole = -1;
var m_curDialog = 0;

function DialogCmd() {

    if (m_curDialog >= NpcRole[m_pickRole].dialog.type.length) { m_screen = SCREEN_GAME; ShowDialog(false); ShowPage(false); return; }

    var cmd = NpcRole[m_pickRole].dialog.type[m_curDialog];
    console.log("cmd=" + cmd);
    if (cmd == "dialog") {
        if (NpcRole[m_pickRole].dialog.html[m_curDialog] != "") {
            m_screen = SCREEN_DIALOG;
            ShowPage(false); ShowDialog(true);
            InsertDialog(NpcRole[m_pickRole].dialog.html[m_curDialog]);
            m_curDialog++; return;
        }
    }
    if (cmd == "page") {
        if (NpcRole[m_pickRole].dialog.html[m_curDialog] != "") {
            m_screen = SCREEN_PAGE;
            ShowDialog(false); ShowPage(true);
            InsertPage(NpcRole[m_pickRole].dialog.html[m_curDialog]);
            m_curDialog++; return;
        }
    }

    if (cmd == "change_map") {

        var map = NpcRole[m_pickRole].dialog.type_argument[m_curDialog];
        LoadMap(map);
        m_curDialog++; return;
    }
}

function MapScroll() {
    var ox = Player.destx - Player.srcx;
    var oy = Player.desty - Player.srcy;
    var speed = 20; //9正常
    if (Math.abs(ox) > speed) { Player.srcx += speed * Math.sign(ox); ChgRoleDirX(Player, Player.srcx + Math.sign(ox) * speed); }
    else if (Math.abs(oy) > speed) { Player.srcy += speed * Math.sign(oy); ChgRoleDirY(Player, Player.srcy + Math.sign(oy) * speed); }

    if (Player.srcx < 24) Player.srcx = 24;
    if (Player.srcy < 0) Player.srcy = 0;

    VirualScreen.srcx = Player.srcx - Screen_w / 2;
    VirualScreen.srcy = Player.srcy - Screen_h / 2;

    context.fillStyle = 'rgb(0,0,0)'; context.fillRect(0, 0, canvas.width, canvas.height);
    Bitblt(imgMap, VirualScreen.srcx, VirualScreen.srcy, Screen_w, Screen_h, 0, 0);
}

function onMouseDown(e) {
    if (e.button != 0) return; getMousePos(canvas, e);

    if (m_screen == SCREEN_DIALOG) { DialogClick(); return; }
    if (m_screen == SCREEN_PAGE) { DialogClick(); return; }
    if (m_screen == SCREEN_GAME) {
        m_pickRole = PickNPC();
        if (m_pickRole >= 0) {
            console.log("pick=" + m_pickRole); console.log(NpcRole[m_pickRole].dialog);

            if (NpcRole[m_pickRole].dialog.type.length > 0) { m_curDialog = 0; DialogCmd(); }
            return;
        }

        Player.destx = VirualScreen.srcx + g_mx;
        Player.desty = VirualScreen.srcy + g_my;

        if (Player.destx < 0) Player.destx = 0;
        if (Player.desty < 0) Player.desty = 0;
        if (Player.destx > imgMap.width - 48) Player.destx = imgMap.width - 48;
        if (Player.desty > imgMap.height - 48) Player.desty = imgMap.height - 48;
    }
}

function DialogClick() { if (m_screen == SCREEN_DIALOG || SCREEN_PAGE) { DialogCmd(); } }

function onMouseUp(e) {
    if (e.button != 0) return; //左鍵
    getMousePos(canvas, e);
    switch (m_screen) {
        case SCREEN_LOAD: if (MouseInRect(795, 703, 1161, 797)) { } break;
    }
}


function onMouseMove(e) { getMousePos(canvas, e); }

function game_Update() {

}

function game_Render() {

    switch (m_screen) {

        case SCREEN_LOAD: DrawLoading(); if (g_loading_ok) m_screen = SCREEN_GAME; break;

        case SCREEN_PAGE:
        case SCREEN_DIALOG:
            for (var i = 0; i < NpcRole.length; i++) { DrawNpc(NpcRole[i]); }
            DrawPlayer(Player);
            break;

        case SCREEN_GAME:
            MapScroll();
            for (var i = 0; i < NpcRole.length; i++) { RoleMove(NpcRole[i]); RoleFrame(NpcRole[i]); DrawNpc(NpcRole[i]); }
            RoleFrame(Player); DrawPlayer(Player);
            break;
    }
}


function Interval_Loading() {

    DrawLoading();
    if (true) { clearInterval(loadIntervalID); gameIntervalID = setInterval(game_Render, cUpdateTime); }
}
