if ("serviceWorker" in navigator) {
  if (navigator.serviceWorker.controller) {
    console.log("[PWA Builder] active service worker found, no need to register");
  } else {
    navigator.serviceWorker
      .register("pwabuilder-sw.js", {
        scope: "./"
      })
      .then(function(reg) {
        console.log("[PWA Builder] Service worker has been registered for scope: " + reg.scope);
      });
  }
}

function countTasks() {
  var tasks = getTasks();
  disp = document.getElementById("taskcount")
  var num = Object.keys(tasks).length;
  if (num > 0) disp.innerText = "Do "+num+" Tasks";
  else disp.innerText = "NO WORK!";
}

countTasks();

function addTask(id) {
  event.preventDefault();
  var tasks = getTasks();
  if(tasks.length == 0) tasks = toObject(tasks);

  var task = document.getElementById(id).value ?? '';
  // task = escapeHtml(task);
  if(task) {
    var ms = Date.now()+"";
    ms = parseInt(ms);
    tasks[ms] = task;
    tasks = JSON.stringify(tasks); 

    setTasks(tasks);
    clearText(id);
    clearText(id+"-type");
  }
}

function deleteTask(id) {
  closeTask(id);
  var tasks = getTasks();
  delete tasks[id];
  tasks = JSON.stringify(tasks); 
  setTasks(tasks);
}

function updateTask(id) {
  var tasks = getTasks();
  var task = document.getElementById(id).innerHTML;
  tasks[id] = task;
  tasks = JSON.stringify(tasks); 
  setTasks(tasks);
}

function setTasks(tasks) {
  localStorage.setItem("tasks", tasks);
  countTasks();
}

function getTasks() {
  var tasks = localStorage.getItem("tasks");
  if(tasks) {
    tasks = JSON.parse(tasks);
  } else {
    tasks = [];
  }
  tasks = Object.keys(tasks).sort().reverse().reduce(
    (obj, key) => { 
      obj[key] = tasks[key]; 
      return obj;
    }, 
    {}
  );
  return tasks;
}

function removeTags(str) {
  return str.replace(/<\/?[^>]+(>|$)/g, "");
}

function listTasks() {
  var tasks = getTasks();
  for (var i of Object.keys(tasks)) {
    var task = tasks[i]
    task = task.replace(/\[\s?\]/g, "<check class='subtask-check'></check>");
    task = task.replace("{", "<h3>");
    task = task.replace("}", "</h3>");
    // task = task.replace(/\[\s?\]/g, "<check>[&nbsp;]</check>");
    
    showTask(i, task);
  }
}

function showTask(id = 1, taskDetail = "Task detail") {
  const tdiv = document.createElement("div");
  taskDetail = taskDetail;
  tdiv.setAttribute("id", "task-"+id);
  tdiv.classList.add('container-box', 'full-height', 'task-details');
  tdiv.innerHTML = "<h3 onclick=\"timerPlay('"+id+"-timer')\" id='"+id+"-timer' class='header-timer'>Start</h3><h2>Task "+id+"</h2><hr>";
  tdiv.innerHTML += "<div contenteditable id='"+id+"' onkeyup='updateTask("+id+")' class='task-detail-view'>"+taskDetail+"</div>";
  tdiv.innerHTML += "<div class='task-buttons'><button class='btn done-button' id='delete-"+id+"' onclick='deleteTask("+id+")'>Done ✓</button><button class='btn close-button' id='close-"+id+"' onclick='closeTask("+id+")'>Save/Later</button></div>";
  document.getElementById("app").appendChild(tdiv);

  const subTaskDoneBtns = document.getElementsByTagName('check');
  if(subTaskDoneBtns) {
    for (var i = 0; i < subTaskDoneBtns.length; i++){
      const subTaskDoneBtn = subTaskDoneBtns[i]
      subTaskDoneBtn.addEventListener('click', () => {
        subTaskDoneBtn.parentNode.remove()
        updateTask(id)
      });
    }
  }
}

function closeTask(id) {
  pauseTimer(id+'-timer')
  var task = document.getElementById("task-"+id);
  task.remove();
}

function toObject(arr) {
  var rv = {};
  for (var i = 0; i < arr.length; ++i)
    rv[i] = arr[i];
  return rv;
}

function copyText(id) {
  var txt = document.getElementById(id);
  txt.select();
  txt.setSelectionRange(0, 99999); /* For mobile devices */
  document.execCommand("copy");
}

function copyDivContentToField(dId, fId) {
  document.getElementById(fId).value = document.getElementById(dId).innerHTML;
}

function clearText(id) {
  var txt = document.getElementById(id);
  txt.value = "";
  txt.innerHTML = "";
  txt.innerText = "";
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function countRandom (id, displayId) {
  var txt = document.getElementById(id);
  txt = txt.value;

  display = document.getElementById(displayId);
  charsLeft = numChars - txt.length;
  
  display.innerHTML = charsLeft;
}

function setCookie(cname, cvalue, exdays = 1) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  let expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function nl2br(str, is_xhtml = false) {
  if (typeof str === 'undefined' || str === null) {
      return '';
  }
  var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
  return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
}

function br2spec(str){
  return str.replace(/<br\s*[\/]?>/gi, "kibretlinebreak");
}

function spec2br(str){
  return str.replace(/kibretlinebreak/gi, "<br>");
}

function escapeHtml(unsafe){
  return unsafe
    .replace(/<br>/g, "\n")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const startPauseButton = document.getElementById('timer');

let isRunning = false;
let currentMinutes = 25; // Initial 25 minutes
let seconds = 0;
let intervalId;

function updateTimerDisplay(id) {
  const timerDisplay = document.getElementById(id);
  const minutes = String(Math.floor(currentMinutes)).padStart(2, '0');
  const formattedTime = minutes+":"+seconds.toString().padStart(2, '0')

  console.log(formattedTime)
  timerDisplay.innerHTML = formattedTime;
}

function startTimer(id) {
  updateTimerDisplay(id);
  isRunning = true;  
  const timerDisplay = document.getElementById(id);
  timerDisplay.classList.remove('timer-paused');
  intervalId = setInterval(() => {
    seconds--;
    if (seconds === -1) {
      seconds = 59;
      currentMinutes--;
    }
    if (currentMinutes === 0 && seconds === 0) {
      clearInterval(intervalId);
      alert('Pomodoro session completed!');
      isRunning = false;
      currentMinutes = 25; // Reset timer for next session
    }
    updateTimerDisplay(id);
  }, 1000);
}

function pauseTimer(id) {
  isRunning = false;
  const timerDisplay = document.getElementById(id);
  timerDisplay.classList.add('timer-paused');
  clearInterval(intervalId);
}

function timerPlay(id){
  if (isRunning) {
    pauseTimer(id);
  } else {
    startTimer(id);
  }
}