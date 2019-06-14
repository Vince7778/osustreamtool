
function j(x){return document.getElementById(x);}

var listening = false;
var hoveringOver = false;
var keys = ['z','x'];
var division = 0.25;
var od = 6;
var speedmod = 1; //0=ht, 1=nm, 2=dt
var diffmod = 1; //0=ez, 1=nm, 2=hr
var firstTime = -1;
var bpm = 180;
var clicks = -1;
var curLeeway = [43.5,91.5,139.5];
var scores = [0,0,0,0];
var longStreak = [0,0,0];
var curStreak = [0,0,0];

document.onkeydown = function(e) {
    if (listening && keys.includes(e.key)) {
        j("temp").innerHTML = stream(Date.now());
    }
};

document.ontouchstart = function(e) {
    if (listening) {
        e.preventDefault();
        for (var i = 0; i < e.changedTouches.length; i++) j("temp").innerHTML = stream(Date.now());
    }
};

document.onmousedown = function(e) {
    if (listening) {
        if (!hoveringOver) {
            e.preventDefault();
            j("temp").innerHTML = stream(Date.now());
        }
    }
};

document.oncontextmenu = function(e) {
    if (listening) e.preventDefault();
};

function toggleListen() {
    listening = !listening;
    firstTime = -1;
    clicks = -1;
    scores = [0,0,0,0];
    longStreak = [0,0,0];
    curStreak = [0,0,0];
    j("offon").innerHTML = listening?"On":"Off";
}

function buttonover(a) {
    hoveringOver = a;
}

function changeOptions() {
    division = Number(j("options").division.value);
    keys[0] = j("options").key0.value;
    keys[1] = j("options").key1.value;
    od = Number(j("options").od.value);
    speedmod = Number(j("options").speed.value);
    diffmod = Number(j("options").diff.value);
    bpm = j("options").bpm.value;
    displayLeeway();
}

function odSlide() {
    od = Number(j("options").od.value);
    j("odoutput").value = od;
    displayLeeway();
}

function displayLeeway() {
    var leewayVar = calcLeeway(od, speedmod, diffmod);
    j("v300").innerHTML = leewayVar[0];
    j("v100").innerHTML = leewayVar[1];
    j("v50").innerHTML = leewayVar[2];
    curLeeway = leewayVar;
}

function displayScore() {
    j("total300").innerHTML = scores[0];
    j("total100").innerHTML = scores[1];
    j("total50").innerHTML = scores[2];
    j("totalmiss").innerHTML = scores[3];
}

function displayStreaks() {
    j("cstreak300").innerHTML = curStreak[0];
    j("cstreak100").innerHTML = curStreak[1];
    j("cstreak50").innerHTML = curStreak[2];
    j("lstreak300").innerHTML = longStreak[0];
    j("lstreak100").innerHTML = longStreak[1];
    j("lstreak50").innerHTML = longStreak[2];
}

function calcLeeway(od, speedmod, diffmod) {
    var diffconst = 1;
    if (diffmod == 0) {
        diffconst = 1/2;
    } else if (diffmod == 2) {
        if (od*1.4>10) {
            od = 10;
        } else {
            diffconst = 1.4;
        }
    }
    var base300 = Math.floor(79-od*6*diffconst)+0.5;
    var base100 = Math.floor(139-od*8*diffconst)+0.5;
    var base50 = Math.floor(199-od*10*diffconst)+0.5;
    var ret = [base300, base100, base50];
    if (speedmod == 0) {
        ret = ret.map(x => x*4/3+2/3);
    } else if (speedmod == 2) {
        ret = ret.map(x => x*2/3+1/3);
    }
    ret = ret.map(x => Math.round(x*100)/100);
    return ret;
}

function stream(time) {
    clicks++;
    if (firstTime == -1) {
        firstTime = time;
        return;
    }
    var timeBtwn = 60000/bpm;
    var curClickTime = timeBtwn*clicks*division+firstTime;
    var calcVal = calcScore(time, curClickTime, false);
    while (calcVal == 4) {
        clicks++;
        curClickTime = timeBtwn*clicks*division+firstTime;
        calcVal = calcScore(time, curClickTime, false);
    }
    if (calcVal == 3) clicks--;
    if (time < curClickTime-curLeeway[0]) return "Overstreaming! "+Math.round((curClickTime-curLeeway[0]-time)*100)/100+" ms";
    else if (time > curClickTime+curLeeway[0]) return "Understreaming! "+Math.abs(Math.round((curClickTime+curLeeway[0]-time)*100)/100)+" ms";
    else return "Ok! ("+(curClickTime>time?"+":"")+Math.round((curClickTime-time)*100)/100+" ms)";
}

function calcScore(time1, time2) {
    var type = -1;
    if (time1 >= time2-curLeeway[0] && time1 <= time2+curLeeway[0]) type = 0;
    else if (time1 >= time2-curLeeway[1] && time1 <= time2+curLeeway[1]) type = 1;
    else if (time1 >= time2-curLeeway[2] && time1 <= time2+curLeeway[2]) type = 2;
    else if (time1 > time2+curLeeway[2]) type = 4;
    else type = 3;
    scores[(type>=3?3:type)]++;
    displayScore();
    updateStreak((type>=3?3:type));
    return type;
}

function updateStreak(type) {
    if (type == 0) curStreak = curStreak.map(x => x+1);
    else if (type == 1) {
        curStreak[0] = 0;
        curStreak[1]++;
        curStreak[2]++;
    } else if (type == 2) {
        curStreak[0] = 0;
        curStreak[1] = 0;
        curStreak[2]++;
    } else curStreak = [0,0,0];
    for (var i = 0; i <= 2; i++) {
        if (longStreak[i] < curStreak[i]) longStreak[i] = curStreak[i];
    }
    displayStreaks();
}


